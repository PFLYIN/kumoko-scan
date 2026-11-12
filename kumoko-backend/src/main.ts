import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🛡️ Ativando a validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 📖 Configuração do Swagger (Documentação)
  const config = new DocumentBuilder()
    .setTitle('Kumoko Scan API')
    .setDescription('API reestruturada com NestJS e DDD para o acervo de mangás e novels.')
    .setVersion('1.0')
    .addTag('Mangas')
    .build();
  
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);

  await app.listen(3000);
  console.log(`🚀 API rodando em: http://localhost:3000`);
  console.log(`📚 Documentação do Swagger em: http://localhost:3000/api-docs`);
}
bootstrap();