import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Express, Request, Response } from 'express';
import * as express from 'express';
import { join } from 'path';
import { promises as fs } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors({
    // 允许前端本地开发或通过环境变量指定来源，未配置则默认放开
    origin: process.env.FRONTEND_ORIGIN?.split(',') ?? true,
    credentials: true,
  });

  const uploadsRoot = join(process.cwd(), 'uploads');
  await fs.mkdir(uploadsRoot, { recursive: true });
  app.use('/uploads', express.static(uploadsRoot));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Personal Blog API')
    .setDescription('个人博客 API 文档')
    .setVersion('1.0')
    .addTag('blog')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '请输入有效的 JWT Token',
      },
      'BearerAuth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // JSON 文档地址（给 orval / 其他代码生成器使用）
  const server = app.getHttpAdapter().getInstance() as Express;
  server.get('/api-docs', (req: Request, res: Response) => {
    res.json(document);
  });

  // Swagger UI
  SwaggerModule.setup('api-docs-ui', app, document);

  const mainPort = Number(process.env.PORT ?? 3000);
  await app.listen(mainPort);

  Logger.log(`主应用已启动，监听端口 ${mainPort}`, 'Bootstrap');
  Logger.log(
    `API文档(UI)地址: http://localhost:${mainPort}/api-docs-ui`,
    'Bootstrap',
  );
  Logger.log(
    `API文档(JSON)地址: http://localhost:${mainPort}/api-docs`,
    'Bootstrap',
  );
}
void bootstrap();
