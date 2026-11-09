import { Injectable } from '@nestjs/common';
import { MangaRepositoryPort } from '../../ports/outbound/manga.repository.port';
import { Manga } from '../../domain/manga.entity';

@Injectable()
export class MangaRepositoryAdapter implements MangaRepositoryPort {
  // 🗄️ Simulando o MariaDB em memória para testarmos a rota HTTP agora mesmo!
  // Quando formos plugar o banco real, só mudaremos o código aqui dentro.
  private bancoDeDados: Manga[] = [];

  async salvar(manga: Manga): Promise<void> {
    this.bancoDeDados.push(manga);
    console.log('📦 [MariaDB Simulado] Salvo com sucesso:', manga.titulo);
  }

  async buscarPorId(id: string): Promise<Manga | null> {
    const manga = this.bancoDeDados.find(m => m.id === id);
    return manga || null;
  }

  async buscarPorTitulo(titulo: string): Promise<Manga | null> {
    const manga = this.bancoDeDados.find(m => m.titulo === titulo);
    return manga || null;
  }
}
