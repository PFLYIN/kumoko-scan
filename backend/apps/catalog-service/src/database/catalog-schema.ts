import { Capitulo } from '../modules/capitulos/entities/capitulo.entity';
import { EventoProcessado } from '../modules/obras/entities/evento-processado.entity';
import { Obra } from '../modules/obras/entities/obra.entity';
import { Pagina } from '../modules/paginas/entities/pagina.entity';
import { CreateCatalogSchema1763150000000 } from './migrations/1763150000000-CreateCatalogSchema';
import { AddImageVariants1763240000000 } from './migrations/1763240000000-AddImageVariants';

/** Migrations importadas explicitamente (o build e webpack; glob nao funciona), em ordem. */
export const CATALOG_MIGRATIONS = [CreateCatalogSchema1763150000000, AddImageVariants1763240000000];

/** Entities do catalogo (tambem registradas via TypeOrmModule.forFeature nos modulos). */
export const CATALOG_ENTITIES = [Obra, Capitulo, Pagina, EventoProcessado];
