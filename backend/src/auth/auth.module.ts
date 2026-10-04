import { ThrottlerModule } from '@nestjs/throttler';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthService } from './auth.service';
import { AdminController, AdminGuard, AuthController } from './auth.controller';
@Module({
  imports: [
    DatabaseModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
  ],
  providers: [AuthService, AdminGuard],
  controllers: [AuthController, AdminController],
  exports: [AdminGuard, AuthService],
})
export class AuthModule {}
