# ADR-002: MariaDB 11.4 com um database por serviço

- **Status:** Aceito
- **Data:** 2026-11-14
- **Substitui:** "MariaDB como banco relacional inicial" (versão monolítica com MariaDB 10.6 e Sequelize).

## Contexto

Os três contextos têm dados fortemente estruturados e relacionais:

- Identidade: `usuarios` com unicidade de e-mail e CPF.
- Catálogo: `obras → capitulos → paginas` com unicidade de número por pai e
  exclusão em cascata.
- Vendas: `pedidos → itens_pedido` com valores monetários exatos (DECIMAL) e
  unicidade `(usuario_id, idempotency_key)` para checkout idempotente.

O legado já usava MariaDB (com tabelas separadas por tipo de obra e `sync({ alter })`),
a equipe conhece SQL e o ambiente de entrega é Docker Compose em uma máquina.

## Decisão

- Usar **MariaDB 11.4 (LTS)** como banco relacional de todos os serviços.
- Aplicar o padrão **database-per-service** em **uma única instância**:
  `kumoko_auth`, `kumoko_catalog` e `kumoko_orders`, cada um com usuário próprio
  (`AUTH_DB_USER`, `CATALOG_DB_USER`, `ORDER_DB_USER`) que só tem `GRANT` no próprio
  database (script `infra/mariadb/init/01-create-databases.sh`).
- Acesso via **TypeORM + mysql2**, com `synchronize: false` e **migrations versionadas**
  executadas no boot (`migrationsRun: true`), importadas explicitamente.
- Valores monetários em `DECIMAL(10,2)`/`DECIMAL(12,2)`, convertidos para `number`
  por `decimalTransformer`; no domínio de Vendas o dinheiro vira centavos inteiros
  (value object `Dinheiro`).
- Tabela `eventos_processados(event_id PK)` nos consumidores, para idempotência de eventos.
- Unificar `mangas`, `livros` e `novels` em `obras.tipo ENUM('manga','livro','novel')`.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| PostgreSQL | Recursos avançados (JSONB, CTEs), muito usado com TypeORM | Migração de dialeto e de dados do legado; nenhum requisito exige recurso exclusivo | Custo sem benefício mensurável |
| MongoDB (documentos) | Pedido como documento único; esquema flexível | Unicidades e cascatas viram código; DECIMAL e transações menos naturais; equipe sem experiência | O domínio é relacional |
| Banco compartilhado (todas as tabelas em um schema) | JOINs entre contextos, uma conexão | Acoplamento por esquema anula a independência dos serviços | Contradiz a ADR-001 |
| Uma instância MariaDB por serviço | Isolamento total de recursos e falhas | 3x memória e operação no Compose local | Excesso para o ambiente; isolamento lógico + usuários separados basta |
| SQLite por serviço | Zero operação | Concorrência limitada; não representa um ambiente real | Inadequado para a demonstração com Compose |

## Consequências

**Positivas**

- Integridade garantida pelo banco (UNIQUE, FK, CASCADE, DECIMAL) dentro de cada contexto.
- Fronteira de dados reforçada por permissão: um bug no `order-service` não consegue
  ler `kumoko_auth.usuarios`.
- Migrations versionadas permitem revisão, CI e rollback planejado (ver
  [`../../operacao/deploy.md`](../../operacao/deploy.md)).

**Negativas / trade-offs**

- Instância única é ponto único de falha físico (mitigado por healthcheck, restart e
  volume `db_data`; evolução: réplica ou serviço gerenciado).
- Sem JOIN entre contextos: o histórico de pedidos usa snapshot (`nome_obra`,
  `tipo_obra`, `capa_url`, `preco_unitario`), o que também é correto para o negócio
  (o preço pago não muda se o catálogo mudar depois).
- Dados derivados (`total_gasto`, `total_vendido`) são eventualmente consistentes.

## Revisitar quando

- Um serviço precisar escalar escrita de forma independente (separar instância).
- Surgir necessidade de busca textual avançada no catálogo (avaliar índice FULLTEXT
  ou motor de busca dedicado).
