# Auditoria técnica do Kumoko Scan

## 1. Objetivo e limites

Este relatório registra uma leitura técnica do estado atual do repositório: arquitetura, execução, interfaces, API, dados, integrações, segurança, testes e operação. A análise diferencia código e configuração existentes de planos/documentação e de funcionalidades ainda não implementadas.

O repositório estava com alterações locais em várias áreas durante a análise; o último commit observado era `c5a8fa5`. As conclusões descrevem o *worktree* observado, não necessariamente apenas o que está publicado no último commit. O app mobile foi tratado como legado arquivado e não foi buildado, executado ou atualizado.

Foi feita revisão estática dos fontes/configurações e validação limitada dos comandos abaixo. Não foram executados testes de intrusão, testes de carga, deploy, inicialização dos serviços ou validação de dados reais. Portanto, “não encontrado” não significa “inexistente” em todo ambiente, e a auditoria não certifica segurança ou prontidão para produção.

## 2. Resumo executivo

O projeto tem uma base funcional para evolução: frontend React/Vite, API Express/TypeScript, persistência Sequelize com MariaDB/MySQL, rotas de catálogo e um contrato OpenAPI inicial. A separação em camadas do Express é um ponto de partida razoável. O frontend web constrói com sucesso, e o teste Express atual passa.

O principal problema não é falta de tecnologia, mas a diferença entre a arquitetura desejada e a arquitetura executável hoje:

- O Compose executa MariaDB e Express; não inclui frontend, Nginx ou Redis.
- Há uma configuração Nginx separada, mas ela depende de certificados e serviços que o Compose não provisiona.
- O arquivo de exemplo do ambiente usa um hostname de banco que não corresponde ao nome do serviço no Compose.
- O NestJS é um protótipo independente e não substitui funcionalmente a API Express.
- A documentação de arquitetura, OpenAPI, CI e gestão é uma base útil, mas partes como Redis, eventos, SLOs e deploy são propostas, não capacidades já demonstradas.

**Prioridade recomendada:** primeiro fechar os riscos de autenticação/autorização, compras, variáveis e exposição de serviços; depois definir uma única API ativa e estabilizar contratos; em seguida completar testes e fluxo operacional; só então introduzir Redis, mensageria e migração progressiva para Nest.

## 3. Mapa do sistema observado

| Componente | Estado observado | Responsabilidade/limite |
|---|---|---|
| Web | Ativo: React 19, React Router e Vite em [`Kumoko_Scan-Front/Kumoko_Scan`](../../Kumoko_Scan-Front/Kumoko_Scan/package.json) | Home, cadastro/login, catálogo de mangás/livros, edição, capítulos/páginas e perfil. |
| API Express | API atualmente ligada ao Compose: Express, TypeScript, Sequelize, JWT, bcrypt, Multer e Swagger em [`Kumoko_Scan-Back`](../../Kumoko_Scan-Back) | Autenticação, catálogo, capítulos, upload, novels e endpoints de compras. |
| Banco | MariaDB 10.6 no Compose; acesso pelo dialeto MySQL do Sequelize em [`docker-compose.yml`](../../docker-compose.yml) | Persistência atual. O startup do Express usa `sequelize.sync({ alter: true })`. |
| API NestJS | Protótipo em [`kumoko-backend`](../../kumoko-backend), com repositório Git próprio | Contexto inicial de mangás; não está ligado ao Compose e não é substituto compatível do Express. |
| Nginx | Configuração existente em [`nginx/default.conf`](../../nginx/default.conf) | Proxy e TLS planejados/configurados em separado; não está declarado no Compose atual. |
| Mobile | Preservado em [`archive/mobile`](../../archive/mobile) | Legado inativo. Não participa do fluxo de execução atual nem deve ser tratado como fonte de atualização contínua. |
| Redis/eventos | Não configurados no Compose nem comprovados na aplicação | Requisitos futuros da rubrica, ainda a implementar e demonstrar. |

### Fluxo real versus fluxo desejado

O fluxo executável no Compose é essencialmente **cliente → API Express publicada no host → MariaDB**. A API publica `/api-docs` e `/files`; o frontend não é um serviço do Compose. O Nginx configura TLS e upstreams, mas não há serviço correspondente no Compose nem montagem dos certificados requerida por essa configuração. Assim, a existência de um arquivo Nginx não comprova que o tráfego atual passe pelo proxy.

O fluxo desejado pode ser **navegador → Nginx/TLS → frontend e API → MariaDB**, com Redis para cache e Pub/Sub. Esse fluxo ainda precisa ser implementado e testado como uma unidade. Não habilitar Redis ou um segundo backend “só para constar”: primeiro definir a fonte da verdade e os contratos.

## 4. Funcionalidades e API atuais

Rotas Express declaradas no backend:

| Área | Rotas observadas | Observação |
|---|---|---|
| Autenticação | `POST /register`, `POST /login` | Cadastro e emissão de token JWT. |
| Mangás | `GET /mangas`, `GET /mangas/:id`, `POST /mangas`, `PUT /mangas/:id`, `DELETE /mangas/:id` | Escrita protegida por middleware administrativo. |
| Capítulos | `GET /capitulos/manga/:manga_id`, `POST /capitulos`, `PUT /capitulos/:id`, `DELETE /capitulos/:id` | Escrita administrativa. |
| Livros | `GET /livros`, `GET /livros/:id`, `POST /livros`, `PUT /livros/:id`, `DELETE /livros/:id` | Escrita administrativa. |
| Novels | `GET /novels`, `POST /novels` | Não foram observadas rotas de edição/exclusão. |
| Páginas | `GET /page/:capitulo_id`, `POST /page/:manga_id/:capitulo_id/:numero_pagina` | Upload protegido por admin; a consulta atual retorna um registro, não a coleção ordenada do capítulo. |
| Compras | `POST /compras/finalizar`, `GET /compras/historico` | Autenticadas; os dados financeiros enviados pelo cliente não devem ser autoritativos. |
| Operação | `GET /api-docs`, `/files` | Swagger UI e conteúdo estático de uploads. |

Referências: [`App.ts`](../../Kumoko_Scan-Back/src/App.ts), [`routes/`](../../Kumoko_Scan-Back/src/routes), [`UploadController.ts`](../../Kumoko_Scan-Back/src/controllers/UploadController.ts), [`CompraController.ts`](../../Kumoko_Scan-Back/src/controllers/CompraController.ts).

O Nest declara `POST /mangas` e `GET /mangas/:id`. O adaptador atual mantém os dados em memória; o GET é um placeholder, e não há validação global instalada. A API também não oferece os recursos de autenticação, livros, capítulos, uploads e compras do Express. A comparação de contratos mostra que **a migração ainda não é compatível**.

O OpenAPI em [`docs/api/openapi.yaml`](../api/openapi.yaml) é um esqueleto útil, não um contrato completo: a revisão superficial não encontrou divergência evidente de caminhos/métodos, mas payloads e respostas de algumas operações ainda precisam ser especificados e testados contra controllers reais.

## 5. Achados priorizados

Severidade considera impacto potencial e contexto atual; riscos condicionados à configuração estão identificados como tais. Confiança indica quão diretamente o problema decorre do código/configuração observado. As recomendações são trabalho futuro, não mudanças feitas nesta auditoria.

### Alta prioridade

#### A1. O cadastro público pode conceder privilégio administrativo

**Evidência:** [`UserController.ts`](../../Kumoko_Scan-Back/src/controllers/UserController.ts#L11-L32) atribui `is_admin` a partir de comparação com endereço de e-mail fixo, e [`auth.ts`](../../Kumoko_Scan-Back/src/routes/auth.ts#L8) expõe cadastro público.
**Impacto:** se o endereço reservado puder ser registrado por outra pessoa, a conta passa a satisfazer os middlewares administrativos e pode alterar o acervo.
**Confiança:** alta; comportamento confirmado no código.
**Próximo passo:** retirar a concessão de privilégio do cadastro público. Provisionar administradores por processo controlado, com auditoria e credencial protegida.

#### A2. O JWT aceita segredo embutido previsível como fallback

**Evidência:** [`AuthController.ts`](../../Kumoko_Scan-Back/src/controllers/AuthController.ts#L54-L58) e [`middlewares/auth.ts`](../../Kumoko_Scan-Back/src/middlewares/auth.ts#L21-L26) usam fallback literal quando `JWT_SECRET` não está definido.
**Impacto:** em implantação sem a variável, a assinatura dos tokens usa um valor conhecido e não um segredo exclusivo do ambiente. A configuração ausente pode, portanto, invalidar a confiança no token.
**Confiança:** alta; risco de exploração depende de a variável realmente faltar.
**Próximo passo:** falhar no startup se o segredo estiver ausente, usar valor forte fora do repositório e estabelecer rotação/invalidação de tokens. Confirmar também como alterações de privilégios afetam tokens já emitidos.

#### A3. A finalização da compra confia em total e preços do cliente e não é atômica

**Evidência:** [`CompraController.ts`](../../Kumoko_Scan-Back/src/controllers/CompraController.ts#L11-L29) grava itens informados no corpo, soma `total` recebido do cliente e não envolve o conjunto numa transação observável.
**Impacto:** registros de compra podem não corresponder ao preço do catálogo; uma falha parcial pode deixar os itens e o total do usuário inconsistentes. Não foi observada confirmação de provedor de pagamento.
**Confiança:** alta; confirmado pela implementação revisada.
**Próximo passo:** recalcular preços e totais no servidor a partir de IDs válidos, validar quantidade/estado, usar transação e idempotência e só registrar pagamento após confirmação confiável.

#### A4. Hostname do banco no exemplo não corresponde ao serviço do Compose

**Evidência:** [`.env.example`](../../.env.example#L1) usa `DB_HOST=mariadb`; o serviço em [`docker-compose.yml`](../../docker-compose.yml#L2-L4) chama-se `database` (o nome do container é outro).
**Impacto:** ao seguir o exemplo, o backend pode não resolver o host de banco na rede do Compose.
**Confiança:** alta.
**Próximo passo:** alinhar hostname e variáveis ao serviço real e validar uma inicialização integrada a partir de configuração de exemplo, sem credenciais reais.

#### A5. Banco e API são publicados diretamente no host

**Evidência:** [`docker-compose.yml`](../../docker-compose.yml#L6-L7) e [`docker-compose.yml`](../../docker-compose.yml#L35-L36) publicam as portas 3306 e 3000; Nginx não está incluído nesse Compose.
**Impacto:** em host acessível por rede, serviços podem ficar expostos sem o proxy/TLS ou controles de borda esperados. O risco é menor se a implantação for comprovadamente local e isolada.
**Confiança:** alta para a publicação; impacto depende do ambiente de rede.
**Próximo passo:** remover publicação desnecessária ou restringir a loopback no desenvolvimento. Definir explicitamente regras de rede e exposição para cada ambiente.

### Prioridade média

#### M1. Alteração automática do schema no startup, sem migrações controladas observadas

**Evidência:** [`server.ts`](../../Kumoko_Scan-Back/src/server.ts#L6-L11) executa `sequelize.sync({ alter: true })`; não foi localizado fluxo de migrações versionadas no backend.
**Impacto:** subir uma nova versão pode modificar schema automaticamente, dificultando revisão, rollback e deploy seguro. Logging SQL também está ligado na configuração revisada.
**Confiança:** alta.
**Próximo passo:** adotar migrações versionadas, aplicar mudanças em etapa controlada, testar rollback e desabilitar logging SQL sensível em produção.

#### M2. Validação da entrada é incompleta e alguns erros podem virar 500

**Evidência:** [`UserController.ts`](../../Kumoko_Scan-Back/src/controllers/UserController.ts#L9-L16) não valida todos os campos; [`validators.ts`](../../Kumoko_Scan-Back/src/utils/validators.ts#L6) acessa `senha.length` sem garantir que `senha` exista. Há conversões numéricas sem validação consistente e paginação sem limite explícito em [`MangaController.ts`](../../Kumoko_Scan-Back/src/controllers/MangaController.ts#L9-L10).
**Impacto:** entradas inválidas podem gerar exceções internas, resultados inesperados ou consultas sem limites operacionais. O servidor também devolve `err.message` em erro 500.
**Confiança:** alta.
**Próximo passo:** validar schemas na fronteira da API, impor limites/paginação, uniformizar erros públicos e registrar detalhes internos apenas nos logs protegidos.

#### M3. Upload valida extensão, não o conteúdo, e a localização persistida não é uma URL

**Evidência:** [`multer.ts`](../../Kumoko_Scan-Back/src/config/multer.ts#L7-L14) restringe extensões e tamanho, mas não valida conteúdo real. [`UploadController.ts`](../../Kumoko_Scan-Back/src/controllers/UploadController.ts#L7-L21) persiste caminho local; a consulta de páginas usa `findOne`, sem retornar e ordenar todas as páginas do capítulo.
**Impacto:** extensão não prova o tipo do arquivo; caminhos locais não são portáveis e podem revelar estrutura do servidor. O endpoint não representa corretamente capítulos com múltiplas páginas.
**Confiança:** alta.
**Próximo passo:** validar MIME/assinatura, manter arquivos em armazenamento não executável com autorização apropriada, guardar URL relativa/chave e disponibilizar lista de páginas ordenada.

#### M4. Frontend usa hosts fixos e URLs de imagem incompatíveis com outros ambientes

**Evidência:** [`api.js`](../../Kumoko_Scan-Front/Kumoko_Scan/src/service/api.js#L3-L5) fixa `https://kumokoscan.local/api`; páginas de mangá montam imagens com `http://localhost:3000`.
**Impacto:** outra máquina/host não consegue usar os endereços fixos; HTTP de imagem numa página HTTPS pode ser bloqueado pelo navegador.
**Confiança:** alta para os valores fixos; impacto depende do deploy.
**Próximo passo:** configurar origem da API por ambiente e centralizar resolução de URLs de arquivo com base no endpoint servido.

#### M5. Rotas web inconsistentes podem deixar o usuário em tela inexistente

**Evidência:** [`App.jsx`](../../Kumoko_Scan-Front/Kumoko_Scan/src/App.jsx#L17-L27) registra `/mangas`, mas [`EditarManga.jsx`](../../Kumoko_Scan-Front/Kumoko_Scan/src/pages/Manga/EditarManga.jsx#L32) navega para `/manga`. Há ainda mapa de rotas separado em `Routes.jsx` que não é o usado pelo `App.jsx`.
**Impacto:** após edição ou erro de carregamento, o usuário pode terminar numa URL sem tela correspondente.
**Confiança:** alta.
**Próximo passo:** consolidar a definição de rotas, alinhar os destinos e criar fallback/404.

#### M6. Estado de sessão web é frágil e o envio de autenticação não é uniforme

**Evidência:** [`AuthContext.jsx`](../../Kumoko_Scan-Front/Kumoko_Scan/src/context/AuthContext.jsx#L8-L20) faz parse de `localStorage` sem tratamento, guarda token no armazenamento acessível a JavaScript e `logout` chama `localStorage.clear()`. Chamadas da API não seguem um padrão central uniforme de cabeçalho.
**Impacto:** sessão corrompida pode impedir inicialização; logout apaga chaves de outras funcionalidades do mesmo domínio; token em `localStorage` pode ser lido por script executado na origem. Não foi demonstrada uma exploração XSS.
**Confiança:** alta para o comportamento; impacto de segurança depende das defesas gerais da aplicação.
**Próximo passo:** recuperar/validar estado inválido, apagar apenas chaves próprias e definir um modelo de sessão coerente. Centralizar o envio do token e confirmar por endpoint quais operações exigem autenticação. Armazenamento em cookie HttpOnly exige também decisão e proteção CSRF adequada.

#### M7. NestJS ainda é protótipo e testes e2e não representam suas rotas

**Evidência:** [`manga.repository.adapter.ts`](../../kumoko-backend/src/manga/adapters/outbound/manga.repository.adapter.ts#L7-L23) armazena em array local; [`main.ts`](../../kumoko-backend/src/main.ts#L4-L6) não instala `ValidationPipe`; `GET /mangas/:id` é placeholder em [`manga.controller.ts`](../../kumoko-backend/src/manga/adapters/inbound/manga.controller.ts#L27-L34). O teste [`app.e2e-spec.ts`](../../kumoko-backend/test/app.e2e-spec.ts#L18-L22) espera `GET /` e “Hello World!”, não declarado pelo módulo.
**Impacto:** dados somem ao reiniciar; validações declaradas em DTO não são aplicadas globalmente; a rota não implementada e o teste legado falham. O POST também não tem autorização observada.
**Confiança:** alta para implementação; falha e2e foi reproduzida nesta auditoria.
**Próximo passo:** antes de migrar tráfego, decidir o escopo do Nest, implementar persistência/validação/autorização e testes para contratos reais. Não manter dois backends como APIs ativas sem estratégia de compatibilidade.

#### M8. Compose, Nginx e certificados não formam ainda uma implantação completa

**Evidência:** [`nginx/default.conf`](../../nginx/default.conf#L14-L15) exige certificados em `/etc/nginx/certs`, porém o Compose não declara Nginx nem monta esses arquivos. Dockerfiles atuais iniciam servidores de desenvolvimento; o Compose não inclui o frontend.
**Impacto:** a configuração Nginx não sobe com o Compose atual por si só, e os Dockerfiles não definem uma imagem de produção adequada.
**Confiança:** alta.
**Próximo passo:** definir perfis local/produção, provisionar certificados de desenvolvimento sem versioná-los, servir build estático do frontend e validar o fluxo ponta a ponta. Manter segredos fora da imagem e dos logs.

#### M9. Conteúdo e controles web dão sinais de funcionalidade que não executam

**Evidência:** [`Home.jsx`](../../Kumoko_Scan-Front/Kumoko_Scan/src/pages/Home/Home.jsx#L30-L49) exibe cartões demonstrativos repetidos e botões sem ação; [`Header.jsx`](../../Kumoko_Scan-Front/Kumoko_Scan/src/componentes/Header/Header.jsx#L18-L35) não oferece navegação alternativa abaixo de `lg`, tem links para rotas não registradas e busca sem handler.
**Impacto:** conteúdo estático pode ser entendido como dado real; controles e navegação não cumprem a expectativa do usuário.
**Confiança:** alta.
**Próximo passo:** conectar a dados reais ou rotular/remover demonstrações; implementar navegação e busca reais ou retirar os controles até estarem disponíveis.

#### M10. Estados de carregamento/erro/vazio e acessibilidade precisam de atenção

**Evidência:** listas de [`Manga.jsx`](../../Kumoko_Scan-Front/Kumoko_Scan/src/pages/Manga/Manga.jsx#L6-L17) e [`Livro.jsx`](../../Kumoko_Scan-Front/Kumoko_Scan/src/pages/Livro/Livro.jsx#L7-L19) registram falhas só no console; formulários apresentam campos sem associações acessíveis consistentes.
**Impacto:** falha de API parece lista vazia e formulários são menos utilizáveis por teclado/leitor de tela. Algumas atualizações locais também usam estado capturado e não indicam submissão em andamento.
**Confiança:** alta para o estado observado; efeitos de concorrência dependem do uso.
**Próximo passo:** estados explícitos de loading/erro/vazio, repetição de tentativa, labels associados, nome acessível de controles e foco/mensagens de erro.

### Prioridade baixa ou pendente

#### B1. Política CSP permite `unsafe-inline` e `unsafe-eval`

**Evidência:** `script-src` em [`nginx/default.conf`](../../nginx/default.conf#L21) permite ambos.
**Impacto:** reduz a proteção que CSP pode oferecer contra injeção de script, caso essa configuração seja ativada.
**Confiança:** alta para a configuração; impacto condicionado à implantação do proxy.
**Próximo passo:** avaliar remoção e uso de nonce/hash depois de confirmar as necessidades do frontend.

#### B2. Cobertura de testes ainda é muito pequena

**Evidência:** o teste Express observado cobre Swagger; não há testes visíveis de fluxos de autenticação, catálogo, upload, compras ou integração com banco. Os fronts não têm arquivos de teste/spec encontrados. A configuração unitária Nest não encontra testes.
**Impacto:** regressões nas funções críticas não são detectadas pela CI atual.
**Confiança:** alta no escopo inspecionado.
**Próximo passo:** priorizar testes de autorização, cadastro/login, validação, transação de compra, contrato da API e smoke de Compose; manter testes sem depender de serviços externos não controlados.

#### B3. Mobile arquivado não deve ser confundido com código ativo

O app preservado contém telas de carrinho/checkout/histórico que não existem no web atual. Isso não significa que devam ser portadas. Há também inconsistência interna do legado: login/interceptor usam `token`, enquanto exclusão em `GerenciarAcervo.tsx` procura `userToken`. Como o mobile está inativo, registrar isso como dívida histórica, não como requisito de correção agora.

## 6. Segurança, dados e operação

### Controles observados

- bcrypt e JWT estão presentes; middleware administrativo separa operações de escrita. Isso é uma base, mas não substitui validação, configuração segura de segredo ou revisão de ciclo de vida do token.
- O Compose mantém MariaDB e API em serviços separados, mas expõe portas no host. Não há demonstração de política de rede de produção.
- O filtro de upload impõe limite de tamanho e extensões; ainda falta verificar conteúdo do arquivo.
- `.gitignore` foi ampliado para segredos e builds, e a chave local `kumoko-scannginxcertslocalhost.key` aparece removida do índice, preservando cópia local. Isso não prova que a chave nunca esteve num remoto/histórico. Se já foi compartilhada ou publicada, tratá-la como comprometida e substituir/revogar; não tentar corrigir histórico sem coordenação.
- Existe `.env` local. Seu conteúdo não foi incluído neste relatório. Não compartilhar valores de ambiente em logs, tickets, prints ou documentação.

### Resiliência e observabilidade

O material de [`quality-and-operations.md`](../architecture/quality-and-operations.md) descreve SLOs, métricas e runbook como proposta. Na implementação revisada não foi comprovada coleta de métricas, tracing, alertas, cache distribuído ou publicação/consumo Redis Pub/Sub. Há logging de SQL que deve ser revisto para produção. O tratamento global do Express inclui detalhes de erro que não devem ser devolvidos ao cliente.

Antes de declarar resiliência, definir timeout de conexão/requisição, limite de payload, health/readiness checks, política de retry apenas para operações seguras e resposta de degradação. Para eventos, definir formato/versionamento, idempotência, tratamento de falha e evidência em logs sem dados pessoais.

## 7. Validações realizadas

| Comando/validação | Resultado |
|---|---|
| `npm run build` em `Kumoko_Scan-Front/Kumoko_Scan` | **Passou**; Vite gerou build de produção. |
| `npm test -- --runInBand` em `Kumoko_Scan-Back` | **Passou**; 1 suíte e 1 teste, cobrindo Swagger. |
| `npm run build` em `kumoko-backend` | **Passou**; compilação Nest. |
| `npm test -- --runInBand` em `kumoko-backend` | **Falhou:** Jest não encontrou testes unitários em `src`. |
| `npm run test:e2e -- --runInBand` em `kumoko-backend` | **Falhou:** `GET /` respondeu 404, enquanto o teste espera 200 e “Hello World!”. |
| `docker compose config --quiet` | **Passou** na verificação anterior; isso valida sintaxe/renderização, não conectividade, certificados nem inicialização dos serviços. |
| `git diff --check` | Já havia apontado whitespace em `Kumoko_Scan-Back/src/server.ts`; essa alteração de trabalho preexistia e foi preservada, não foi corrigida nesta auditoria. |

Não foram executados `docker compose up`, deploy, testes de carga, build/teste do mobile, nem chamadas reais à API. O startup do Express executa `sync({ alter: true })`; por isso não é prudente usar um banco de dados importante como alvo de testes locais sem backup e ambiente isolado.

## 8. Comandos úteis e fluxo seguro

Executar a partir do PowerShell:

```powershell
# Front web
Set-Location C:\kumoko-scan\Kumoko_Scan-Front\Kumoko_Scan
npm run dev
npm run build

# Testes da API Express
Set-Location C:\kumoko-scan\Kumoko_Scan-Back
npm test -- --runInBand

# Protótipo NestJS (repositório separado)
Set-Location C:\kumoko-scan\kumoko-backend
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand

# Validar configuração do Compose sem subir containers
Set-Location C:\kumoko-scan
docker compose config --quiet
```

Os comandos Nest de teste atualmente servem para reproduzir a lacuna (sem testes unitários e e2e incompatível), não para certificar o backend. Para subir o Compose, primeiro conferir `.env.example` e variáveis obrigatórias sem copiar segredos para o repositório; utilizar dados descartáveis/backup, pois o backend pode alterar o schema ao iniciar.

## 9. Recomendações e ordem de execução

1. **Fechar fronteira de segurança:** remover promoção administrativa por cadastro público; exigir segredo JWT externo; revisar autorização e payloads; não confiar em preço/total do cliente.
2. **Tornar a execução reproduzível:** alinhar hostname/variáveis do Compose; decidir portas públicas; incluir frontend/Nginx apenas após acertar upstreams e certificados de desenvolvimento.
3. **Estabilizar contrato e dados:** definir uma API ativa (recomendação atual: manter Express enquanto o Nest é construído), completar OpenAPI a partir de controllers, implantar migrações versionadas e corrigir URLs/retorno de uploads.
4. **Cobrir os fluxos críticos:** testes de auth/admin, compras transacionais, CRUD, erros, upload e smoke integrado; CI deve validar também configuração Compose e contrato.
5. **Evoluir para Nest passo a passo:** primeiro persistência e compatibilidade de contratos, depois validação/autorização, testes e migração por rota/versão. Não apontar frontend para Nest até a paridade necessária estar demonstrada.
6. **Só então implementar Redis/eventos e operação:** cache-aside com TTL/invalidação testados; Pub/Sub com idempotência/logs; health checks, métricas, alertas, runbook e estratégia documentada de rollback.
7. **Manter o mobile arquivado:** deixar `archive/mobile` fora da CI e dos fluxos ativos; consultar telas antigas apenas para selecionar ideias que façam sentido ao produto web, sem manter ou portar o app inteiro.

## 10. Opinião técnica

A direção “web ativo, mobile preservado como arquivo, backend evoluindo gradualmente para Nest, MariaDB e Docker mantidos” é adequada para este projeto. Eu **não** migraria tudo do mobile nem reescreveria o backend de uma vez. Isso criaria duas fontes de comportamento e ampliaria o risco sem primeiro resolver o contrato e as regras de domínio.

Eu manteria o Express como backend operacional até haver paridade comprovada e testes; usaria o Nest para aprender e implementar um contexto pequeno com banco real e contratos definidos. Para a rubrica, uma demonstração ponta a ponta confiável de um módulo (por exemplo, catálogo) vale mais do que declarar Redis, observabilidade ou uma arquitetura distribuída sem operação verificável.

O próximo marco de qualidade deve ser **um ambiente local reproduzível e seguro**, com frontend, API, banco e proxy realmente conectados, mais testes de autorização e persistência. Depois desse marco, cache, eventos e melhorias de arquitetura terão um lugar concreto para serem implementados e avaliados.
