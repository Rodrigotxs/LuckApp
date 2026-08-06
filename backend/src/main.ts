import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { validarEnv } from './config/env.validation';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  // Falha rápido se a configuração estiver incompleta ou insegura.
  const env = validarEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: env.isProducao
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Headers de segurança. CSP fica desligada porque a API não serve HTML
  // próprio (o Swagger UI quebra com a política padrão do helmet).
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

  // Necessário para o rate limit enxergar o IP real atrás de proxy/CDN.
  app.set('trust proxy', 1);

  app.enableCors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      // Em produção não devolvemos os detalhes internos de validação.
      disableErrorMessages: false,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // Fecha conexões de banco corretamente em SIGTERM (deploy/rollback).
  app.enableShutdownHooks();

  // Swagger só fora de produção — a documentação expõe todo o mapa da API.
  if (!env.isProducao) {
    const config = new DocumentBuilder()
      .setTitle('Barbearia Luck API')
      .setDescription('Sistema de agendamento da Barbearia Luck')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  await app.listen(env.PORT);
  const logger = new Logger('Bootstrap');
  logger.log(`API rodando na porta ${env.PORT} (${env.NODE_ENV})`);
  if (!env.isProducao) logger.log(`Swagger em http://localhost:${env.PORT}/api/docs`);
}

bootstrap();
