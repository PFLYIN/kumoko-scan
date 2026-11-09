export class Manga {
  constructor(
    public readonly id: string,
    public titulo: string,
    public autor: string,
    public capaUrl: string,
    public ativo: boolean,
  ) {}

  // 🛡️ Regra de Negócio Pura (DDD): Ninguém altera o título para vazio
  atualizarTitulo(novoTitulo: string) {
    if (!novoTitulo || novoTitulo.trim() === '') {
      throw new Error('O título da obra não pode estar vazio.');
    }
    this.titulo = novoTitulo;
  }

  // 🛡️ Regra de Negócio Pura (DDD): Inativar uma obra do catálogo
  inativarObra() {
    this.ativo = false;
  }
}