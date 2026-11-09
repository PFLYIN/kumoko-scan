import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CriarMangaDto {
  @IsString({ message: 'O título deve ser um texto.' })
  @IsNotEmpty({ message: 'O título não pode estar vazio.' })
  titulo: string;

  @IsString({ message: 'O autor deve ser um texto.' })
  @IsNotEmpty({ message: 'O autor não pode estar vazio.' })
  autor: string;

  @IsUrl({}, { message: 'A capa deve ser uma URL válida.' })
  capaUrl: string;
}