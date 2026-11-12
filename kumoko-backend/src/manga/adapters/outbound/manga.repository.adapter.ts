import { Injectable } from '@nestjs/common';
import { Manga } from '../../domain/manga.entity';

@Injectable()
export class MangaRepositoryAdapter {
  // Nosso "banco de dados" temporário em memória
  private mangas: Manga[] = [];

  salvar(manga: Manga): Manga {
    this.mangas.push(manga);
    return manga;
  }

  // 🔍 Método adicionado para buscar a obra específica pelo ID
  buscarPorId(id: string): Manga | undefined {
    return this.mangas.find(manga => manga.id === id);
  }
}