import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CriarMangaDto {
  @ApiProperty({ 
    example: 'Kumo desu ga, nani ka!?', 
    description: 'O título oficial da obra' 
  })
  @IsString({ message: 'O título deve ser um texto.' })
  @IsNotEmpty({ message: 'O título não pode estar vazio.' })
  titulo: string;

  @ApiProperty({ 
    example: 'Okina Baba', 
    description: 'Nome do autor ou roteirista' 
  })
  @IsString({ message: 'O autor deve ser um texto.' })
  @IsNotEmpty({ message: 'O autor não pode estar vazio.' })
  autor: string;

  @ApiProperty({ 
    example: 'https://site.com/capa-kumo.jpg', 
    description: 'URL da imagem de capa' 
  })
  @IsUrl({}, { message: 'A capa deve ser uma URL válida.' })
  capaUrl: string;
}