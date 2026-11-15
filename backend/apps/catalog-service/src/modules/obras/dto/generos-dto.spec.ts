import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateObraDto } from './create-obra.dto';
import { UpdateObraDto } from './update-obra.dto';

describe('generos no DTO multipart', () => {
  it('converte lista separada por virgula em array', async () => {
    const dto = plainToInstance(CreateObraDto, {
      tipo: 'manga',
      nome: 'X',
      preco: '10',
      generos: 'Ação, Fantasia ,',
    });
    expect(dto.generos).toEqual(['Ação', 'Fantasia']);
    expect(await validate(dto)).toHaveLength(0);
  });

  it("'' vira lista vazia (limpa) e ausente fica undefined (mantem)", () => {
    expect(plainToInstance(UpdateObraDto, { generos: '' }).generos).toEqual([]);
    expect(plainToInstance(UpdateObraDto, {}).generos).toBeUndefined();
  });

  it('campo repetido (array) tambem e aceito', () => {
    expect(plainToInstance(UpdateObraDto, { generos: ['Ação', 'Drama,Romance'] }).generos).toEqual([
      'Ação',
      'Drama',
      'Romance',
    ]);
  });
});
