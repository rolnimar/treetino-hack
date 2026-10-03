import { Injectable } from '@nestjs/common';
import { TREETINO_PROGRAM_ID, type ProtocolInfo } from '@treetino/contracts';

@Injectable()
export class ProtocolService {
  getInfo(): ProtocolInfo {
    return {
      name: 'treetino',
      network: 'devnet',
      programId: TREETINO_PROGRAM_ID,
    };
  }
}
