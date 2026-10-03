import 'reflect-metadata';
import type { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function createApplication(options?: NestApplicationOptions) {
  const app = await NestFactory.create(AppModule, options);
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  return app;
}
