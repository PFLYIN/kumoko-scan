# ADR-003: Redis para cache distribuído (cache-aside) e mensageria (Pub/Sub)

- **Status:** Aceito
- **Data:** 2026-11-14

## Contexto

- O catálogo é a parte mais lida do sistema e muda pouco (somente o administrador
  escreve). Listagens com filtros e o leitor de capítulos repetem as mesmas consultas.
- Com três serviços (e possíveis réplicas), um cache em memória de processo ficaria
  inconsistente; é preciso cache **distribuído** com invalidação central.
- Após a separação ([ADR-001](./ADR-001-microsservicos.md)), alguns efeitos colaterais
  cruzam contextos: concluir pedido precisa somar `total_gasto` (Identidade) e
  `total_vendido` (Catálogo); mudar uma obra precisa invalidar o cache de preços do
  `order-service`.
- A rubrica pede cache com Redis e mensageria com Redis Pub/Sub, com logs comprovando a
  circulação. A equipe prefere uma única dependência de infraestrutura nova.

## Decisão

Usar **um Redis 7.4** (com senha, dados no volume `redis_data`) para duas funções.

**Cache-aside** (`@kumoko/cache`, `CacheService.getOrSet`):

| Chave | Dono | TTL | Invalidação |
|---|---|---|---|
| `catalog:obras:list:<hash-dos-filtros>` | catalog | `CACHE_TTL_SECONDS` (60 s) | escrita de obra e evento `order.completed` → prefixo `catalog:obras:` |
| `catalog:obras:id:<id>` | catalog | 60 s | idem |
| `catalog:obras:capitulos:<obraId>` | catalog | 60 s | escrita de capítulo/página daquela obra |
| `catalog:capitulos:paginas:<capituloId>` | catalog | 60 s | escrita de página do capítulo |
| `orders:catalog-precos:<ids-ordenados>` | order | 30 s | eventos `catalog.obra.updated/deleted` → prefixo `orders:catalog-precos:` |

- Falha do Redis **nunca derruba a requisição**: `getOrSet` registra `warn` e chama o
  loader (banco ou HTTP). `enableOfflineQueue: false` e `maxRetriesPerRequest: 2`
  evitam requisições presas esperando o Redis.
- Invalidação por prefixo com `SCAN` + `UNLINK` (nunca `KEYS`).
- Respostas cacheadas devolvem `X-Cache: HIT|MISS` para demonstração.

**Pub/Sub** (`@kumoko/messaging`, `EventBus`): canal `kumoko.events.<type>`, envelope
`{ id, type, source, occurredAt, correlationId, payload }`, conexão de assinatura
dedicada (`REDIS_SUBSCRIBER`). Eventos: `order.completed`, `catalog.obra.updated`,
`catalog.obra.deleted` e `user.registered`. Consumidores que alteram dados são
idempotentes pelo `id` do envelope (tabela `eventos_processados`).

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| Cache em memória por processo | Sem dependência | Inconsistente entre réplicas; invalidação não se propaga | Não é distribuído |
| Memcached | Simples e rápido | Sem Pub/Sub nem SCAN por prefixo | Exigiria outra peça para eventos |
| RabbitMQ | Entrega garantida, filas duráveis, DLQ | Mais um container e conceitos (exchanges, ack) | Ganho não compensa no escopo; fica como evolução |
| Kafka | Log durável, replay | Pesado para Compose local | Desproporcional |
| Redis Streams | Persistência, consumer groups, ack | API mais complexa | Primeiro passo natural de evolução (mesmo Redis) |

## Consequências

**Positivas**

- Uma dependência para cache e eventos; operação simples.
- Leituras do catálogo servidas do Redis dentro do TTL; invalidação imediata nas escritas.
- Eventos desacoplam Identidade e Catálogo do fluxo síncrono do checkout.

**Negativas / trade-offs**

- **Pub/Sub é at-most-once:** se um consumidor estiver desconectado no momento da
  publicação, o evento é perdido. Aceitável aqui porque os efeitos são contadores
  derivados e invalidação de cache (que também expira por TTL). Não usar Pub/Sub para
  nada que precise de garantia (ex.: pagamento).
- O cache traz janela de dados velhos de até 60 s para mudanças que não passam pelas
  invalidações (ex.: alteração manual no banco).
- O Redis vira dependência compartilhada: se cair, o cache vira pass-through e os
  eventos param até a reconexão.

## Revisitar quando

- Perda de evento gerar divergência relevante: Redis Streams com consumer group ou
  padrão Outbox (tabela `outbox` + publicador).
- Taxa de HIT medida baixa: rever TTL e granularidade das chaves.
