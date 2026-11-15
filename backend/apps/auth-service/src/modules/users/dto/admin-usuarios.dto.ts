import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@kumoko/common';
import { USER_ROLES, type UserRole } from '@kumoko/security';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { UsuarioResponseDto } from './usuario-response.dto';

export const ORDENACOES_USUARIOS = ['recentes', 'nome', 'maior-gasto'] as const;
export type OrdenacaoUsuarios = (typeof ORDENACOES_USUARIOS)[number];

/** Listagem administrativa de usuarios. */
export class ListarUsuariosQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nome ou e-mail (contém).', maxLength: 100 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100, { message: 'busca deve ter no máximo 100 caracteres.' })
  busca?: string;

  @ApiPropertyOptional({ enum: USER_ROLES })
  @IsOptional()
  @IsIn(USER_ROLES, { message: `role deve ser um de: ${USER_ROLES.join(', ')}.` })
  role?: UserRole;

  @ApiPropertyOptional({ type: String, example: '3,7,12', description: 'Ids separados por vírgula (máx. 50).' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((v) => Number(v.trim()))
          .filter((v) => v !== 0)
      : value,
  )
  @IsArray()
  @ArrayMaxSize(50, { message: 'ids aceita no máximo 50 valores.' })
  @IsInt({ each: true, message: 'ids deve conter apenas inteiros.' })
  @Min(1, { each: true, message: 'ids deve conter apenas inteiros positivos.' })
  ids?: number[];

  @ApiPropertyOptional({ enum: ORDENACOES_USUARIOS, default: 'recentes' })
  @IsOptional()
  @IsIn(ORDENACOES_USUARIOS, { message: `ordenar deve ser um de: ${ORDENACOES_USUARIOS.join(', ')}.` })
  ordenar: OrdenacaoUsuarios = 'recentes';
}

export class AlterarRoleDto {
  @ApiProperty({ enum: USER_ROLES, example: 'admin' })
  @IsIn(USER_ROLES, { message: `role deve ser um de: ${USER_ROLES.join(', ')}.` })
  role: UserRole;
}

class PaginationMetaDto {
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() total: number;
  @ApiProperty() totalPages: number;
}

export class PaginatedUsuarioResponseDto {
  @ApiProperty({ type: [UsuarioResponseDto] })
  data: UsuarioResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class ResumoUsuariosResponseDto {
  @ApiProperty({ example: 25 })
  totalUsuarios: number;

  @ApiProperty({ example: 23 })
  clientes: number;

  @ApiProperty({ example: 2 })
  admins: number;

  @ApiProperty({ example: 7, description: 'Cadastros nos últimos 30 dias' })
  novosUltimos30Dias: number;

  @ApiProperty({ example: 11, description: 'Usuários com total gasto > 0' })
  compradores: number;
}
