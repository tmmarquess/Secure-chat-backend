import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';

async function bootstrap() {
  const httpsOptions = {
    key: readFileSync('./sslFiles/key.pem'),
    cert: readFileSync('./sslFiles/cert.pem'),
  };

  const app = await NestFactory.create(AppModule /*, { httpsOptions }*/);
  app.enableCors();
  await app.listen(3001);
}
bootstrap();
