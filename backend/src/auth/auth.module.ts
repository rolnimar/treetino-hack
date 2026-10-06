import { ThrottlerModule } from '@nestjs/throttler';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthService } from './auth.service';
import {
  AdminController,
  AdminGuard,
  AuthController,
  ClientController,
  ClientGuard,
} from './auth.controller';
@Module({
  imports: [
    DatabaseModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
  ],
  providers: [AuthService, AdminGuard, ClientGuard],
  controllers: [AuthController, AdminController, ClientController],
  exports: [AdminGuard, ClientGuard, AuthService],
})
export class AuthModule {}
