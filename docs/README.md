# Documentação do projeto

## Escopo e fontes de verdade atuais

- **Interface ativa:** `Kumoko_Scan-Front/Kumoko_Scan` (React, Vite e React Router).
- **API usada pelo Compose existente:** `Kumoko_Scan-Back` (Express/TypeScript).
- **Banco usado pelo Compose existente:** MariaDB.
- **Mobile:** `archive/mobile`, somente preservado como histórico; não executar nem
  atualizar.

Há também uma pasta `kumoko-backend` com repositório Git próprio. Ela não é
referenciada pelo `docker-compose.yml` da raiz e não foi incorporada a este fluxo.
Antes de mudar a API ativa, confirme se essa pasta é uma alternativa experimental ou
se deve substituir `Kumoko_Scan-Back`.

O `docker-compose.yml` atual não inclui Nginx, frontend ou Redis; já
`nginx/default.conf` espera containers chamados `kumoko_frontend` e
`kumoko_backend`. A integração desses serviços é uma pendência, não uma capacidade
já disponível.

## Documentos

- [Arquitetura, C4 e mapa de contextos](./architecture/architecture.md)
- [ADR-001: monólito modular](./architecture/adr/ADR-001-monolito-modular.md)
- [ADR-002: MariaDB](./architecture/adr/ADR-002-mariadb.md)
- [Qualidade, SLOs, resiliência e observabilidade](./architecture/quality-and-operations.md)
- [Contrato OpenAPI inicial](./api/openapi.yaml)
- [Cynefin e backlog inicial pronto para Jira](./project/management-and-backlog.md)

## Como entregar

O fluxo sugerido é uma história pequena por vez, cobrindo interface, API e validação.
O CI em `.github/workflows/ci.yml` executa build do web e teste de fumaça da API.
O deploy continua manual até que o ambiente de produção, domínio, segredos e método
de rollback sejam confirmados; o pipeline não simula nem anuncia uma publicação.

Os SLOs, métricas e domínios nos documentos são propostas iniciais para discussão e
medição. Não devem ser apresentados como capacidades já implementadas sem evidência.
