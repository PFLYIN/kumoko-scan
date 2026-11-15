import { PartialType } from '@nestjs/swagger';
import { CreateObraDto } from './create-obra.dto';

/**
 * Corpo multipart de PATCH /api/obras/:id: todos os campos opcionais.
 * Ausente = mantem; '' em autor/descricao/volume = limpa (null); tipo=livro zera o volume.
 */
export class UpdateObraDto extends PartialType(CreateObraDto) {}
