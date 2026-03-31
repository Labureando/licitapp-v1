import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const logger = new Logger('Bootstrap');

  // Seguridad
  app.use(helmet());

  // CORS — permitir peticiones de web y mobile
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:8081', 'http://localhost:19006'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validación automática de datos de entrada
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Prefijo de la API
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/dependencies'],
  });

  // Swagger — documentación interactiva
  const config = new DocumentBuilder()
    .setTitle('LicitaApp API')
    .setDescription('API del SaaS de licitaciones públicas en España')
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .addTag('Auth', 'Registro, login, tokens')
    .addTag('Users', 'Gestión de usuarios y organizaciones')
    .addTag('Licitaciones', 'Búsqueda y gestión de licitaciones')
    .addTag('Subvenciones', 'Subvenciones y ayudas públicas')
    .addTag('Alertas', 'Alertas personalizadas')
    .addTag('Analytics', 'Análisis de competencia')
    .addTag('Scraping', 'Estado de scrapers')
    .addTag('IA', 'Inteligencia artificial')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'LicitaApp API Docs',
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 Backend en http://localhost:${port}`);
  logger.log(`📚 Swagger en http://localhost:${port}/api/docs`);
  logger.log(`❤️ Health en http://localhost:${port}/health`);
}
bootstrap();