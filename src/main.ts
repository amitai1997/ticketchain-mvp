import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { BlockchainExceptionFilter } from './common/filters/blockchain-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Apply global filters
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new BlockchainExceptionFilter(),
  );

  // Apply global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Apply global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Configure Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TicketChain API')
    .setDescription('Blockchain-based ticketing platform API')
    .setVersion('1.0')
    .addTag('events', 'Event management endpoints')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // Enable CORS
  app.enableCors();

  // Get the port from configuration
  const port = configService.get<number>('api.port') || 3000;

  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
