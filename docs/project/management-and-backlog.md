# Gestão do projeto e backlog inicial

## Cynefin e abordagem

Classificação inicial: **Complexo**. O produto combina regras de catálogo e compra,
novas telas e decisões de arquitetura ainda não validadas. A solução não é totalmente
previsível; é necessário experimentar, observar uso e adaptar o desenho.

Abordagem: **ágil, com fluxo Kanban e entregas versionadas**. Trabalhar em itens
pequenos, limitar trabalho em progresso e validar cada fatia vertical com critérios
de aceite. Reclassificar o contexto se os requisitos e o comportamento se tornarem
estáveis. Não assumir uma gestão preditiva para funcionalidades ainda exploratórias.

## Fluxo e políticas

`Backlog -> Pronto -> Em andamento -> Revisão -> Teste -> Concluído`

- Cada história tem valor, prioridade, responsável no Jira e critérios verificáveis.
- Limitar WIP para terminar antes de iniciar outro fluxo.
- Bloqueios e decisões arquiteturais viram issues vinculadas; revisar o backlog
  semanalmente.
- Uma história só está concluída quando critérios de aceite, autorização server-side,
  testes e documentação aplicável passaram.
- Criar uma versão/tag para cada entrega demonstrável; registrar mudanças e riscos.

## Backlog inicial (criar como issues no Jira)

Os itens abaixo são sementes de backlog, não issues criadas nem atribuições reais.
Definir responsáveis e datas no Jira com a equipe.

### P0 — Fundação e arquitetura

**Bug/Task: Como equipe, quero substituir certificados e segredos que possam ter
sido versionados antes de publicar o novo ambiente.**

- Aceite: verificar remotos e histórico sem copiar segredos para issues/logs; se
  houver publicação, revogar/substituir o certificado e coordenar a limpeza do
  histórico; confirmar que `.env` e chaves estão ignorados e fora do índice.

**Story: Como equipe, quero definir qual API é a fonte de verdade para implementar
e operar um único backend.**

- Aceite: comparar `Kumoko_Scan-Back` e `kumoko-backend`; registrar decisão,
  persistência, endpoints e caminho de deploy em ADR; atualizar Compose e CI somente
  após a decisão.
- Tarefas: inventário de endpoints; decisão de backend; revisão de configuração.

**Story: Como usuário, quero abrir a aplicação web ativa com build reproduzível.**

- Aceite: `npm ci` e build funcionam a partir da raiz de `Kumoko_Scan-Front/Kumoko_Scan`;
  CI executa o build em pull requests; mobile fica fora do workflow.
- Tarefas: confirmar raiz web; documentar comandos; adicionar pipeline de build.

### P1 — Experiência web

**Story: Como leitor, quero explorar um catálogo responsivo e buscar obras.**

- Aceite: estados carregando/vazio/erro; busca e filtro acessíveis por teclado;
  layout utilizável em celular e desktop; dados obtidos da API, sem credenciais ou
  regras privilegiadas no cliente.
- Tarefas: definir tokens visuais; criar componentes; validar API e tratamento de erro.

**Story: Como leitor, quero consultar os detalhes de uma obra e seus capítulos.**

- Aceite: rota web por obra; informações e capítulos consistentes com API; 404 e
  indisponibilidade têm mensagens acessíveis; imagens têm texto alternativo.

### P1 — Identidade e administração

**Story: Como usuário, quero autenticar-me e sair da conta com segurança.**

- Aceite: erros não revelam se senha/conta existe; token não é logado; expiração e
  logout têm comportamento definido; endpoints privados validam autorização no servidor.
- Tarefa bloqueada: escolher estratégia de sessão web e proteção CSRF antes de
  implementar armazenamento.

**Story: Como administrador autorizado, quero manter o acervo.**

- Aceite: CRUD e upload exigem papel administrativo na API; validação de tipo e
  tamanho; erro explícito; não confiar em botão oculto no frontend como autorização.

### P2 — Compras e qualidade operacional

**Story: Como leitor autenticado, quero finalizar uma compra e consultar histórico.**

- Aceite: servidor recalcula preços/totais; operação transacional e idempotente;
  falha não duplica compra; histórico pertence ao usuário autenticado.

**Task: Como equipe, quero cachear leituras frequentes com Redis.**

- Aceite: cache-aside documentado; TTL testado; update/delete invalida chave correta;
  queda do Redis não impede leitura do banco; métricas de hit/miss disponíveis.

**Task: Como equipe, quero publicar e consumir eventos não críticos via Redis Pub/Sub.**

- Aceite: logs correlacionados de publicação e consumo; teste reproduz a circulação;
  documentação deixa claro que Pub/Sub não é armazenamento durável nem fluxo de compra.

**Task: Como equipe, quero um Compose coerente com Nginx, web, API, MariaDB e Redis.**

- Aceite: nomes de serviço alinhados; healthchecks e dependências funcionam; Nginx
  encaminha rotas web/API; segredos não ficam em Git; teste local documentado.

## Versões sugeridas

- `v0.1`: decisão do backend, arquitetura, contrato API e CI de build/teste.
- `v0.2`: navegação e catálogo web com estados de erro/vazio.
- `v0.3`: autenticação, perfil e administração com autorização server-side.
- `v0.4`: compras/histórico, resiliência, Redis e evidências de observabilidade.

As versões são proposta inicial. Criar os itens no Jira, priorizar com a equipe e
atualizar versões/status conforme o trabalho real.
