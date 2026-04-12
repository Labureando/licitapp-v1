/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { morganMiddleware } from './config/morgan.config';
import { config } from './config/env.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

// Desactivar warnings de deprecación
process.removeAllListeners('warning');
process.on('warning', () => {});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aplicar los filtros globales
  app.useGlobalFilters(new HttpExceptionFilter());

  // Aplicar Response Interceptor global
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Aplicar middleware de logging
  app.use(morganMiddleware);

  // Configurar CORS
  app.enableCors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cache-Control',
      'Pragma',
    ],
  });

  // Configurar ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Configurar prefijo global de rutas
  app.setGlobalPrefix(`${config.api.prefix}/${config.api.version}`);

  // Configurar Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle(config.appName)
    .setDescription('API documentation')
    .setVersion(config.api.version)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(config.port);
  console.log(`🚀 Application is running on: http://localhost:${config.port}`);
  console.log(
    `📚 Swagger docs available at: http://localhost:${config.port}/docs`
  );
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err.message);
  process.exit(1);
});
