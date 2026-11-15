import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../shared/dto/error-response.dto';
import { TipoObra } from '../domain/tipo-obra';

/** Representacao publica de uma obra (JSON camelCase). */
export class ObraResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: TipoObra, example: TipoObra.Manga })
  tipo: TipoObra;

  @ApiProperty({ example: 'Dandadan' })
  nome: string;

  @ApiProperty({ example: 'Yukinobu Tatsu', nullable: true, type: String })
  autor: string | null;

  @ApiProperty({ example: 'Volume 1 de Dandadan.', nullable: true, type: String })
  descricao: string | null;

  @ApiProperty({ example: ['Ação', 'Sobrenatural'], type: [String], description: 'Gêneros/tags da obra' })
  generos: string[];

  @ApiProperty({ example: 1, nullable: true, type: Number })
  volume: number | null;

  @ApiProperty({ example: 39.9 })
  preco: number;

  @ApiProperty({ example: 4.8 })
  avaliacao: number;

  @ApiProperty({ example: '/files/covers/1731600000000-uuid.jpg', nullable: true, type: String })
  capaUrl: string | null;

  @ApiProperty({
    example: '/files/covers/1731600000000-uuid.thumb.webp',
    nullable: true,
    type: String,
    description: 'Capa WebP 360px para cards; igual a capaUrl se a variante nao existir; null sem capa.',
  })
  capaThumbUrl: string | null;

  @ApiProperty({
    example: '/files/covers/1731600000000-uuid.medium.webp',
    nullable: true,
    type: String,
    description: 'Capa WebP 720px para detalhe; igual a capaUrl se a variante nao existir; null sem capa.',
  })
  capaMediaUrl: string | null;

  @ApiProperty({ example: 0 })
  totalVendido: number;

  @ApiProperty({ example: '2026-11-14T12:00:00.000Z' })
  criadoEm: string;

  @ApiProperty({ example: '2026-11-14T12:00:00.000Z' })
  atualizadoEm: string;
}

/** Lista paginada de obras: `{ data, meta }`. */
export class PaginatedObrasResponseDto {
  @ApiProperty({ type: [ObraResponseDto] })
  data: ObraResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
