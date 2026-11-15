import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { TipoObra } from '../domain/tipo-obra';
import { CreateObraDto } from './create-obra.dto';
import { ListObrasQueryDto } from './list-obras-query.dto';
import { UpdateObraDto } from './update-obra.dto';

function erros(dto: object): string[] {
  return validateSync(dto, { whitelist: true, forbidNonWhitelisted: true }).map((e) => e.property);
}

describe('CreateObraDto (multipart)', () => {
  it('converte strings em numeros e "" em null nos campos anulaveis', () => {
    const dto = plainToInstance(CreateObraDto, {
      tipo: 'manga',
      nome: '  Dandadan ',
      autor: '',
      descricao: '   ',
      volume: '',
      preco: '39,90',
      avaliacao: '4.5',
    });
    expect(dto).toMatchObject({
      nome: 'Dandadan',
      autor: null,
      descricao: null,
      volume: null,
      preco: 39.9,
      avaliacao: 4.5,
    });
    expect(erros(dto)).toEqual([]);
  });

  it('avaliacao vazia vira undefined (usa o padrao)', () => {
    const dto = plainToInstance(CreateObraDto, { tipo: 'livro', nome: 'X', preco: '10', avaliacao: '' });
    expect(dto.avaliacao).toBeUndefined();
    expect(erros(dto)).toEqual([]);
  });

  it('rejeita preco invalido, preco com 3 casas, volume fracionado e tipo desconhecido', () => {
    expect(erros(plainToInstance(CreateObraDto, { tipo: 'manga', nome: 'X', preco: 'abc' }))).toContain(
      'preco',
    );
    expect(erros(plainToInstance(CreateObraDto, { tipo: 'manga', nome: 'X', preco: '1.999' }))).toContain(
      'preco',
    );
    expect(
      erros(plainToInstance(CreateObraDto, { tipo: 'manga', nome: 'X', preco: '1', volume: '1.5' })),
    ).toContain('volume');
    expect(erros(plainToInstance(CreateObraDto, { tipo: 'gibi', nome: 'X', preco: '1' }))).toContain('tipo');
  });

  it('rejeita preco ausente e campos fora da whitelist', () => {
    const props = erros(plainToInstance(CreateObraDto, { tipo: 'manga', nome: 'X', extra: '1' }));
    expect(props).toEqual(expect.arrayContaining(['preco', 'extra']));
  });
});

describe('UpdateObraDto (multipart)', () => {
  it('todos os campos sao opcionais; ausentes ficam undefined', () => {
    const dto = plainToInstance(UpdateObraDto, { tipo: TipoObra.Livro });
    expect(erros(dto)).toEqual([]);
    expect(dto.preco).toBeUndefined();
    expect(dto.volume).toBeUndefined();
  });

  it('"" em volume limpa (null) e preco texto e convertido', () => {
    const dto = plainToInstance(UpdateObraDto, { volume: '', preco: '12.5' });
    expect(dto).toMatchObject({ volume: null, preco: 12.5 });
    expect(erros(dto)).toEqual([]);
  });
});

describe('ListObrasQueryDto', () => {
  it('aceita filtros validos e aplica paginacao padrao', () => {
    const dto = plainToInstance(ListObrasQueryDto, { tipo: 'novel', busca: ' re ', ordenar: 'preco-asc' });
    expect(dto).toMatchObject({ tipo: 'novel', busca: 're', ordenar: 'preco-asc', page: 1, limit: 12 });
    expect(erros(dto)).toEqual([]);
  });

  it('rejeita ordenacao desconhecida e limit acima de 50', () => {
    const props = erros(plainToInstance(ListObrasQueryDto, { ordenar: 'aleatorio', limit: '51' }));
    expect(props).toEqual(expect.arrayContaining(['ordenar', 'limit']));
  });
});
