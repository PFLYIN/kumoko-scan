# Cynefin — classificação do domínio e abordagem de gestão

O framework Cynefin (Snowden) separa problemas em **Claro**, **Complicado**,
**Complexo** e **Caótico** conforme a relação entre causa e efeito. A classificação
define se cabe planejar tudo antes (preditivo) ou experimentar e adaptar (ágil).

## 1. Classificação por parte do problema

O Kumoko Scan não cai inteiro em um único domínio; cada frente foi classificada:

| Frente | Domínio | Evidência | Prática adequada |
|---|---|---|---|
| CRUD do acervo, cadastro/login, upload de imagens | **Claro** | Padrões conhecidos; o legado já fazia; causa e efeito óbvios | Boas práticas (checklists, padrões Nest, testes) |
| Microsserviços, cache, mensageria, resiliência, CI/CD | **Complicado** | Há resposta certa, mas exige análise de especialista e trade-offs (ver ADRs) | Análise → decisão registrada (ADR) → implementação |
| Produto: o que o leitor valoriza (leitor online x compra, destaques, busca, mobile) | **Complexo** | O produto mudou três vezes (catálogo → e-commerce → mobile → web de novo); o mobile foi construído e arquivado; o comportamento do usuário só aparece depois da entrega | Sondar → perceber → responder: entregas pequenas, feedback, backlog revisado |
| Incidente em produção (site fora do ar) | **Caótico** (momentâneo) | Sem tempo para análise | Agir primeiro (runbook, rollback) e depois analisar |

## 2. Classificação geral: **Complexo** (com núcleo técnico Complicado)

Justificativa:

- O histórico do projeto mostra **emergência**: o escopo foi descoberto fazendo. A v0.3
  (app mobile) foi abandonada depois de pronta porque não se mostrou o melhor caminho;
  isso é típico do domínio complexo, onde só a experimentação revela o que funciona.
- Os requisitos de produto ainda não são estáveis (pagamento real, leitura paga x
  gratuita, novos tipos de obra).
- A parte técnica, embora difícil, é **Complicada**: há boas práticas conhecidas e a
  equipe as resolve com análise (ADRs, blueprint de arquitetura).

## 3. Abordagem escolhida: **Híbrida, predominantemente ágil**

| Elemento | Preditivo ou ágil | Como aplicamos |
|---|---|---|
| Arquitetura de referência (contratos, portas, eventos) | Preditivo leve | Blueprint e ADRs definidos antes da reestruturação v1.0.0, para que várias frentes trabalhem em paralelo sem conflito |
| Funcionalidades de produto | Ágil (Scrum) | Sprints de 2 semanas, backlog priorizado por valor (MoSCoW), revisão com feedback |
| Fluxo de bugs e operação | Ágil (Kanban) | Coluna de expedição para incidentes, WIP limitado |
| Releases | Incremental | Versões SemVer a cada incremento demonstrável ([backlog.md](./backlog.md#6-versionamento-e-lançamentos-parciais)) |

Por que não totalmente preditivo (cascata): requisitos de produto mudam; planejar tudo
antes teria produzido o app mobile completo e só então descoberto que o foco é o web.

Por que não "ágil sem nenhum plano": com três serviços desenvolvidos em paralelo, um
contrato instável gera retrabalho. Fixar contratos (OpenAPI, eventos, env vars) é a
parte Complicada tratada com análise antecipada.

## 4. Práticas Scrum + Kanban (Scrumban)

- **Sprint** de 2 semanas com objetivo de sprint ligado a uma versão.
- **Cerimônias:** planning (seleciona histórias do topo do backlog), daily curta,
  review (demonstração com a stack no Compose), retrospectiva.
- **Board Kanban** no Jira com limites de WIP (detalhes em [jira.md](./jira.md)).
- **Definition of Ready:** história no formato "Como... quero... para...", critérios de
  aceite em Gherkin, estimada, sem dependência bloqueante.
- **Definition of Done:** critérios aceitos; testes unitários; lint e build verdes na CI;
  smoke test do Compose verde; OpenAPI/docs atualizados; sem segredo no código.
- **Revisão de classificação:** a cada release, reavaliar — se o produto estabilizar,
  as frentes migram de Complexo para Complicado e o planejamento pode ficar mais longo.
