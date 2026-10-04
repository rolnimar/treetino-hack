import 'reflect-metadata';
import type { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

export async function createApplication(options?: NestApplicationOptions) {
  const app = await NestFactory.create(AppModule, options);
  app.setGlobalPrefix('api');
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Treetino API')
    .setDescription(
      'Public tree listings, protocol information, and finalized Solana event history. Amounts and tree IDs are decimal strings to preserve precision.',
    )
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    () => SwaggerModule.createDocument(app, swaggerConfig),
    {
      jsonDocumentUrl: 'api/docs-json',
    },
  );
  app.enableShutdownHooks();
  return app;
}
