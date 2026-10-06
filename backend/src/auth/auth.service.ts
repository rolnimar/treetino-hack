import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createPublicKey, randomBytes, randomUUID, verify } from 'node:crypto';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { SignJWT, jwtVerify } from 'jose';
import { and, eq, gt, lte } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { admins, authChallenges } from '../database/schema';

export function validateWallet(wallet: unknown): string {
  try {
    if (typeof wallet !== 'string' || wallet.length > 44) throw new Error();
    const key = new PublicKey(wallet);
    if (key.toBase58() !== wallet || !PublicKey.isOnCurve(key.toBytes()))
      throw new Error();
    return wallet;
  } catch {
    throw new BadRequestException('A valid Solana signing wallet is required');
  }
}

@Injectable()
export class AuthService {
  private readonly secret: Uint8Array;
  private readonly origin: string;
  constructor(private readonly database: DatabaseService) {
    const secret = process.env.AUTH_JWT_SECRET;
    if (secret && Buffer.byteLength(secret) < 32)
      throw new Error('AUTH_JWT_SECRET must contain at least 32 bytes');
    if (!secret && process.env.NODE_ENV === 'production')
      throw new Error('AUTH_JWT_SECRET is required in production');
    // Development sessions are invalidated on restart unless a stable secret is configured.
    this.secret = secret ? new TextEncoder().encode(secret) : randomBytes(32);
    const origin = new URL(process.env.AUTH_ORIGIN ?? 'http://localhost:5173');
    if (!['http:', 'https:'].includes(origin.protocol))
      throw new Error('AUTH_ORIGIN must be an HTTP or HTTPS origin');
    this.origin = origin.origin;
    if (process.env.NODE_ENV === 'production' && !process.env.AUTH_ORIGIN)
      throw new Error('AUTH_ORIGIN is required in production');
  }

  async challenge(input: unknown, role: 'admin' | 'client' = 'admin') {
    const wallet = validateWallet(input);
    const id = randomUUID();
    const expiresAt = Date.now() + 5 * 60_000;
    const message = `${this.origin} requests Treetino ${role} access.\n\nWallet: ${wallet}\nNonce: ${id}\nIssued at: ${new Date().toISOString()}\nExpires at: ${new Date(expiresAt).toISOString()}\n\nSigning this message authenticates you. It does not send a transaction.`;
    await this.database.db
      .delete(authChallenges)
      .where(lte(authChallenges.expiresAt, Date.now()));
    await this.database.db
      .insert(authChallenges)
      .values({ id, wallet, message, expiresAt });
    return { id, message, expiresAt: new Date(expiresAt).toISOString() };
  }

  async login(
    id: unknown,
    input: unknown,
    signature: unknown,
    role: 'admin' | 'client' = 'admin',
  ) {
    const wallet = validateWallet(input);
    if (
      typeof id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      )
    )
      throw new BadRequestException('Invalid challenge ID');
    const [challenge] = await this.database.db
      .select()
      .from(authChallenges)
      .where(
        and(
          eq(authChallenges.id, id),
          eq(authChallenges.wallet, wallet),
          gt(authChallenges.expiresAt, Date.now()),
        ),
      );
    if (!challenge)
      throw new UnauthorizedException('Challenge expired or already used');
    if (
      !challenge.message.startsWith(
        `${this.origin} requests Treetino ${role} access.\n`,
      )
    )
      throw new UnauthorizedException(
        'Challenge is for a different access role',
      );
    let valid = false;
    try {
      if (typeof signature !== 'string' || signature.length > 88)
        throw new Error();
      const bytes = bs58.decode(signature);
      const key = createPublicKey({
        key: Buffer.concat([
          Buffer.from('302a300506032b6570032100', 'hex'),
          new PublicKey(wallet).toBuffer(),
        ]),
        format: 'der',
        type: 'spki',
      });
      valid =
        bytes.length === 64 &&
        verify(null, Buffer.from(challenge.message), key, bytes);
    } catch {
      /* Invalid encodings are authentication failures. */
    }
    if (!valid) throw new UnauthorizedException('Invalid wallet signature');
    const consumed = await this.database.db
      .delete(authChallenges)
      .where(
        and(
          eq(authChallenges.id, id),
          gt(authChallenges.expiresAt, Date.now()),
        ),
      )
      .returning({ id: authChallenges.id });
    if (!consumed.length)
      throw new UnauthorizedException('Challenge expired or already used');
    if (role === 'client') {
      const expires = Math.floor(Date.now() / 1000) + 3600;
      const accessToken = await new SignJWT({ wallet, role: 'client' })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setSubject(wallet)
        .setIssuer('treetino')
        .setAudience('treetino-client')
        .setIssuedAt()
        .setExpirationTime(expires)
        .sign(this.secret);
      return {
        accessToken,
        expiresAt: new Date(expires * 1000).toISOString(),
        client: { wallet },
      };
    }
    const [admin] = await this.database.db
      .select()
      .from(admins)
      .where(eq(admins.wallet, wallet));
    if (!admin) throw new ForbiddenException('This wallet is not an admin');
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const accessToken = await new SignJWT({ wallet, role: 'admin' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(admin.id)
      .setIssuer('treetino')
      .setAudience('treetino-admin')
      .setIssuedAt()
      .setExpirationTime(expires)
      .sign(this.secret);
    return {
      accessToken,
      expiresAt: new Date(expires * 1000).toISOString(),
      admin,
    };
  }

  async authenticateClient(header: string | undefined) {
    if (!header?.startsWith('Bearer '))
      throw new UnauthorizedException('Client bearer token required');
    try {
      const { payload } = await jwtVerify(header.slice(7), this.secret, {
        algorithms: ['HS256'],
        issuer: 'treetino',
        audience: 'treetino-client',
        requiredClaims: ['exp', 'iat', 'sub'],
      });
      if (
        payload.role !== 'client' ||
        typeof payload.wallet !== 'string' ||
        payload.sub !== payload.wallet
      )
        throw new Error();
      return { wallet: payload.wallet };
    } catch {
      throw new UnauthorizedException('Invalid or expired client token');
    }
  }

  async authenticate(header: string | undefined) {
    if (!header?.startsWith('Bearer '))
      throw new UnauthorizedException('Admin bearer token required');
    let subject: string;
    let wallet: string;
    try {
      const { payload } = await jwtVerify(header.slice(7), this.secret, {
        algorithms: ['HS256'],
        issuer: 'treetino',
        audience: 'treetino-admin',
        requiredClaims: ['exp', 'iat', 'sub'],
      });
      if (
        payload.role !== 'admin' ||
        typeof payload.sub !== 'string' ||
        typeof payload.wallet !== 'string'
      )
        throw new Error();
      subject = payload.sub;
      wallet = payload.wallet;
    } catch {
      throw new UnauthorizedException('Invalid or expired admin token');
    }
    const [admin] = await this.database.db
      .select()
      .from(admins)
      .where(eq(admins.wallet, wallet));
    if (!admin || admin.id !== subject)
      throw new ForbiddenException('Admin access revoked');
    return admin;
  }
}
