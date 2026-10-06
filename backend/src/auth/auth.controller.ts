import { ThrottlerGuard } from '@nestjs/throttler';
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiProperty,
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';

class ChallengeRequest {
  @ApiProperty({ description: 'Solana wallet public key (base58)' })
  wallet!: string;
}
class LoginRequest extends ChallengeRequest {
  @ApiProperty({ format: 'uuid' }) challengeId!: string;
  @ApiProperty({
    description: 'Base58 Ed25519 signature of the exact challenge message',
  })
  signature!: string;
}
class AdminDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() wallet!: string;
}
class ChallengeDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() message!: string;
  @ApiProperty({ format: 'date-time' }) expiresAt!: string;
}
class SessionDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ format: 'date-time' }) expiresAt!: string;
  @ApiProperty({ type: AdminDto }) admin!: AdminDto;
}
type AdminRequest = { headers: { authorization?: string }; admin: AdminDto };

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    request.admin = await this.auth.authenticate(request.headers.authorization);
    return true;
  }
}

class ClientDto {
  @ApiProperty() wallet!: string;
}
class ClientSessionDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ format: 'date-time' }) expiresAt!: string;
  @ApiProperty({ type: ClientDto }) client!: ClientDto;
}
export type ClientRequest = {
  headers: { authorization?: string };
  client: { wallet: string };
};
@Injectable()
export class ClientGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<ClientRequest>();
    request.client = await this.auth.authenticateClient(
      request.headers.authorization,
    );
    return true;
  }
}
@Controller('client')
@ApiTags('Client')
@ApiBearerAuth()
@UseGuards(ClientGuard)
export class ClientController {
  @Get('me')
  @ApiOkResponse({ type: ClientDto })
  me(@Req() request: ClientRequest) {
    return request.client;
  }
}

@Controller('auth')
@ApiTags('Authentication')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('challenge')
  @ApiCreatedResponse({ type: ChallengeDto })
  @ApiBadRequestResponse({ description: 'Invalid wallet' })
  challenge(@Body() body: ChallengeRequest) {
    return this.auth.challenge(body?.wallet);
  }
  @Post('client/challenge')
  @ApiCreatedResponse({ type: ChallengeDto })
  clientChallenge(@Body() body: ChallengeRequest) {
    return this.auth.challenge(body?.wallet, 'client');
  }
  @Post('client/login')
  @ApiCreatedResponse({ type: ClientSessionDto })
  clientLogin(@Body() body: LoginRequest) {
    return this.auth.login(
      body?.challengeId,
      body?.wallet,
      body?.signature,
      'client',
    );
  }
  @Post('login')
  @ApiCreatedResponse({ type: SessionDto })
  @ApiUnauthorizedResponse({
    description: 'Invalid signature or expired/replayed challenge',
  })
  @ApiForbiddenResponse({ description: 'Wallet is not an admin' })
  login(@Body() body: LoginRequest) {
    return this.auth.login(body?.challengeId, body?.wallet, body?.signature);
  }
}

@Controller('admin')
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
export class AdminController {
  @Get('me')
  @ApiOkResponse({ type: AdminDto })
  @ApiUnauthorizedResponse({ description: 'Missing, invalid or expired token' })
  @ApiForbiddenResponse({ description: 'Admin access revoked' })
  me(@Req() request: AdminRequest) {
    return request.admin;
  }
}
