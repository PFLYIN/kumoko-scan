# Qualidade, SLOs, resiliência e observabilidade

> Metas iniciais propostas. Medir a linha de base em ambiente de teste antes de
> tratá-las como compromisso de produção.

## Cenários e SLOs iniciais

| Atributo | Cenário / indicador | Meta inicial proposta | Como medir |
|---|---|---|---|
| Desempenho | Resposta de leitura do catálogo (SLI p95) | <= 500 ms em carga nominal | Histograma HTTP por rota e status |
| Disponibilidade | Requisições válidas da API atendidas (SLI) | >= 99,5% mensal | Respostas não-5xx / total, excluindo healthchecks |
| Resiliência | API permanece pronta após reinício do banco | Recuperar em até 60 s após dependência pronta | Teste de reinício em ambiente local |
| Segurança | Operação administrativa sem papel autorizado | 100% bloqueada (401/403) | Testes de autorização por rota |
| Integridade | Total de compra aceito pelo servidor | Nunca confiar em total do cliente | Teste de contrato/invariante no fechamento |

O tempo de catálogo e a disponibilidade são SLOs candidatos; registrar tráfego e
latência antes de ajustar limites. Disponibilidade real inclui frontend, proxy, API
e banco.

## Resiliência

- **Timeout:** definir timeouts por chamada HTTP e por dependência; o frontend web
  ainda precisa padronizar o timeout de API.
- **Retry:** manter tentativas limitadas somente para falhas transitórias e operações
  idempotentes; não repetir compras sem chave de idempotência.
- **Circuit breaker:** introduzir apenas se chamadas remotas/cache justificarem;
  Redis Pub/Sub não substitui fila durável.
- **Banco:** readiness/healthcheck e backoff limitado antes de aceitar tráfego. A API
  atual já tenta conectar ao banco com limite de tentativas, mas o Compose ainda não
  declara healthcheck para o banco.
- **Redis (pendente):** cache-aside somente para consultas frequentes, TTL explícito
  e invalidação após update/delete do catálogo. Falha de cache deve permitir
  fallback controlado ao banco, com métricas e limite de carga.
- **Eventos (pendente):** Redis Pub/Sub pode demonstrar eventos não críticos e
  registrar publish/consume; mensagens podem se perder durante desconexões. Não
  processar compra ou pagamento exclusivamente por Pub/Sub.

## Observabilidade

- Métricas: contagem e latência HTTP por rota/status; taxa de erro; conexões e
  latência do banco; hit/miss/erro de cache; publishes/consumes de eventos; uso de
  memória e reinícios.
- Logs estruturados: timestamp UTC, nível, serviço, ambiente, request ID, rota,
  status e duração. Registrar decisões de autenticação/autorização sem token,
  senha, CPF completo ou conteúdo sensível.
- Alertas: erro 5xx elevado, p95 acima do SLO, falta de readiness e indisponibilidade
  de banco/cache.
- Saúde: separar liveness (processo vivo) de readiness (dependências essenciais
  prontas). Não expor detalhes internos em respostas públicas.

## Segredos e certificados

Uma chave TLS local que estava rastreada foi removida do índice do Git nesta etapa,
preservando a cópia de trabalho e adicionando padrões de ignore. Se essa chave já foi
enviada a um remoto, considerá-la exposta: emitir um novo par de certificado/chave,
atualizar os ambientes e coordenar a remoção do histórico compartilhado. Não
reintroduzir a cópia local no repositório.

## Incidente: indisponibilidade

1. Verificar healthchecks e logs dos serviços, usando request ID e horário UTC.
2. Identificar se a falha está no proxy, frontend, API, MariaDB ou Redis; conferir
   espaço em disco e conectividade.
3. Mitigar sem apagar dados: retirar tráfego do componente indisponível e, se
   necessário, voltar à última versão publicada conhecida.
4. Validar readiness, login, leitura do catálogo e uma operação não destrutiva antes
   de reabrir tráfego.
5. Registrar impacto, causa, ações e prevenção; nunca copiar segredos ou dados
   pessoais para os logs do incidente.

## Deploy e rollback

Deploy automático está **pendente** de confirmar ambiente, domínio, armazenamento
de imagens, gestão de segredos e responsável pela publicação. Até lá, publicar
manualmente uma versão identificada e preservar a anterior; rollback significa
reimplantar a versão anterior e validar readiness e fluxos críticos. Não executar
migrações destrutivas como parte de rollback.
