import { Injectable } from '@nestjs/common';
import { Manga } from '../../domain/manga.entity';

@Injectable()
export class MangaRepositoryAdapter {
  private mangas: Manga[] = [];

  salvar(manga: Manga): Manga {
    this.mangas.push(manga);
    return manga;
  }

  // 🔍 Novo método para buscar um mangá específico pelo ID
  buscarPorId(id: string): Manga | undefined {
    return this.mangas.find(manga => manga.id === id);
  }
}