import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cors from 'cors';

async function bootstrap() {
  console.log('Starting application...');
  console.log('Environment check:', {
    PORT: process.env.PORT,
    REDIS_URL_EXISTS: !!process.env.REDIS_URL,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
  });

  const app = await NestFactory.create(AppModule);

  // 🔴 CORS MUST be registered as middleware (preflight-safe)
  app.use(
    cors({
      origin: [
        'https://study-monkey-frontend.vercel.app',
        'http://localhost:3000',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 204,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT || 3001, '127.0.0.1');
  console.log(`Application is running on: http://localhost:${process.env.PORT || 3001}`);
}

bootstrap();
