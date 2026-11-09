import { Module } from '@nestjs/common';
import { MangaModule } from './manga/manga.module';

@Module({
  imports: [MangaModule], // 🚀 Registrando o Bounded Context de Mangá!
  controllers: [],
  providers: [],
})
export class AppModule {}