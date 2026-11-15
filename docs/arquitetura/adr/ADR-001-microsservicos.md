# ADR-001: Evoluir do monólito Express para três microsserviços NestJS

- **Status:** Aceito
- **Data:** 2026-11-14
- **Substitui:** a versão anterior desta ADR ("iniciar com monólito modular"), que
  mantinha uma única API e adiava a separação em processos.
- **Versão do produto:** v1.0.0

## Contexto

O Kumoko Scan nasceu como um **monólito Express + Sequelize** (`Kumoko_Scan-Back`,
junho de 2026) servindo o site React e, depois, um app mobile. Essa API concentrava
cadastro, login, catálogo (tabelas separadas `mangas`, `livros`, `novels`), capítulos,
páginas, uploads e compras. Ela entregou valor rápido (v0.1 a v0.3), mas a auditoria
técnica de novembro de 2026 encontrou problemas estruturais:

- regras de segurança espalhadas e frágeis (admin concedido pelo e-mail no cadastro,
  segredo JWT com valor de fallback, preço da compra aceito do cliente);
- nenhuma fronteira entre "o que é catálogo" e "o que é venda": a compra gravava
  itens e somava o total do usuário sem transação e sem consultar o catálogo;
- `sequelize.sync({ alter: true })` no boot no lugar de migrações;
- um protótipo NestJS paralelo (`kumoko-backend`) sem paridade de funcionalidades.

Forças da decisão, declaradas com honestidade:

1. **Rubrica e aprendizado.** A disciplina exige demonstrar cache distribuído,
   mensageria, gateway, resiliência entre serviços e Context Map com Bounded
   Contexts reais. Em um único processo, retry/circuit breaker e eventos entre
   contextos ficariam artificiais.
2. **Perfil de carga desigual.** Leitura do catálogo e do leitor de capítulos
   (listagens e muitas imagens) é muito mais frequente que checkout. Separar o
   `catalog-service` permite escalar réplicas e cache só onde há carga.
3. **Isolamento de falhas do checkout.** Uma falha ou deploy no catálogo não deve
   corromper pedidos; o `order-service` precisa degradar de forma controlada
   (503 rápido com circuit breaker) em vez de travar.
4. **Fronteiras de domínio claras.** Identidade, Catálogo e Vendas têm linguagens e
   ritmos de mudança diferentes (ver [`../ddd.md`](../ddd.md)).

## Decisão

Reescrever o backend como **três microsserviços NestJS** em um monorepo
([ADR-005](./ADR-005-nestjs-monorepo.md)), um por Bounded Context:

| Serviço | Porta | Bounded Context | Database |
|---|---|---|---|
| `auth-service` | 3001 | Identidade e Acesso | `kumoko_auth` |
| `catalog-service` | 3002 | Catálogo e Leitura (inclui gestão do acervo) | `kumoko_catalog` |
| `order-service` | 3003 | Vendas / Pedidos | `kumoko_orders` |

Regras que tornam a decisão aplicável:

- **Database por serviço** ([ADR-002](./ADR-002-banco-mariadb-por-servico.md)): nenhum
  serviço lê tabela de outro.
- **Integração síncrona mínima:** só `order-service → catalog-service`
  (`GET /api/obras/lote`) para obter preço confiável no checkout, protegida por
  timeout, retry e circuit breaker.
- **Integração assíncrona por eventos** em Redis Pub/Sub
  ([ADR-003](./ADR-003-redis-cache-e-pubsub.md)) para efeitos colaterais que toleram
  consistência eventual (`total_gasto`, `total_vendido`, invalidação de cache).
- **Validação local do JWT** em cada serviço
  ([ADR-006](./ADR-006-autenticacao-jwt-cookie.md)), sem chamada ao `auth-service`
  por requisição.
- **Gateway único** Nginx ([ADR-004](./ADR-004-nginx-gateway.md)); só ele publica portas.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| Manter o monólito Express e corrigir os bugs | Menor esforço imediato; uma implantação | Mantém acoplamento e dívidas (Sequelize `sync`, tabelas por tipo de obra); não demonstra os itens da rubrica | Não resolve a falta de fronteiras nem atende aos objetivos da disciplina |
| **Monólito modular (modulith) em NestJS** | Transações locais, um deploy, operação simples, fronteiras por módulo | Isolamento de falhas e escala independente só no papel; cache/eventos entre módulos tendem a virar chamadas diretas | Era a decisão anterior. É tecnicamente adequada ao tamanho atual, mas não permite demonstrar resiliência entre processos nem escala separada do catálogo |
| Microsserviços finos (5+: usuários, obras, capítulos, uploads, pedidos, pagamentos) | Granularidade máxima | Custo operacional alto para uma equipe pequena; muitas chamadas síncronas | Fronteiras por entidade e não por contexto; distribuído demais |
| Serverless / funções | Escala automática | Dependência de provedor; uploads e conexões com MariaDB ficam complexos | Fora do ambiente da disciplina (Docker Compose local) |

## Consequências

**Positivas**

- Cada contexto tem modelo, banco e ciclo de deploy próprios; o `order-service`
  pôde ganhar um aggregate rico (`Pedido`) sem afetar o catálogo.
- Falhas ficam contidas: catálogo fora do ar degrada só o checkout (503); Redis fora
  do ar degrada só o cache; a leitura do catálogo continua.
- `catalog-service` pode receber réplicas e cache sem replicar autenticação e vendas.
- Contratos explícitos (OpenAPI e payloads de eventos em `@kumoko/messaging`).

**Negativas / trade-offs**

- **Consistência eventual:** `total_gasto` e `total_vendido` são atualizados por
  evento e podem atrasar; se o consumidor estiver fora do ar no momento da
  publicação, o evento se perde (Pub/Sub não persiste).
- **Sem transação distribuída:** o pedido guarda snapshot de nome/preço da obra
  (`itens_pedido.nome_obra`, `preco_unitario`) em vez de FK para o catálogo.
- **Mais operação:** 7 containers, healthchecks, ordem de subida e logs em vários
  lugares (mitigado com `X-Request-Id` e logs JSON, ver
  [`../../operacao/observabilidade.md`](../../operacao/observabilidade.md)).
- **Latência extra** no checkout (uma chamada HTTP interna, mitigada com cache de 30 s).
- Código compartilhado em libs exige disciplina para não virar um "monólito
  distribuído": libs contêm infraestrutura e contratos, nunca regra de domínio.

## Revisitar quando

- O custo operacional superar o benefício (ex.: equipe sem tempo para manter 3
  serviços). Voltar para um modulith NestJS é barato porque os módulos já são separados.
- Houver perda de eventos com impacto no negócio: migrar Pub/Sub para Redis Streams
  ou Outbox + broker durável.
- Entrar pagamento real: criar o contexto de Pagamentos e uma saga de pedido.
