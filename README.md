Kumoko Scan - E-commerce e Acervo de Obras
Contextualização do Problema e Evolução do Produto
O projeto consiste no desenvolvimento de uma plataforma de comércio eletrônico voltada para a comercialização e leitura de mangás, livros e light novels.

A necessidade do projeto surgiu a partir da dificuldade de centralizar o acervo de publicações independentes e traduções. Inicialmente, o público e os leitores entravam em contato de forma descentralizada para consultar a disponibilidade de volumes, lançamentos e informações sobre os capítulos. Esse modelo gerava um fluxo de atendimento manual pouco escalável.

Diante desse problema, o produto passou por diferentes versões ao longo de seu desenvolvimento, buscando solucionar gradualmente as necessidades identificadas.

Primeira versão - Catálogo online
A primeira versão teve como principal objetivo disponibilizar as informações do acervo na internet e reduzir a necessidade de contato direto para consultas básicas. Foi desenvolvido um site que apresentava as obras disponíveis e suas capas. Dessa forma, o leitor podia consultar previamente o catálogo.

Entretanto, nessa primeira versão ainda não existia um processo de compra integrado. Caso o usuário tivesse interesse em adquirir uma obra física ou digital, o fluxo dependia de direcionamentos externos para conclusão manual.

Segunda versão - Implementação do e-commerce
A segunda versão surgiu com o objetivo de transformar o catálogo em uma plataforma de comércio eletrônico propriamente dita, permitindo que o cliente realizasse o processo de compra diretamente pelo sistema.

Nessa etapa, foi desenvolvida uma área administrativa (Painel do Administrador / Mestre das Sombras), permitindo o gerenciamento completo do acervo. Foram implementadas funcionalidades essenciais para os clientes, incluindo:

Cadastro de usuários com validação de CPF e e-mail;

Login e autenticação segura baseada em tokens JWT;

Gerenciamento de conta;

Carrinho de compras global;

Seleção de produtos e finalização de pedidos;

Histórico de compras integrado ao banco de dados.

Terceira versão - Expansão para dispositivos móveis
Na terceira versão, o objetivo foi expandir o acesso à plataforma por meio de um aplicativo móvel desenvolvido em React Native e Expo, permitindo que os leitores naveguem pelo acervo e realizem compras diretamente pelo celular de forma nativa e responsiva.

Arquitetura e Diagramas do Sistema
1. Diagrama Entidade-Relacionamento (DER)
Snippet de código
erDiagram
    usuarios ||--o{ compras : realiza
    mangas ||--o{ capitulos : possui
    mangas ||--o{ compras : comprado_como
    livros ||--o{ compras : comprado_como
    novels ||--o{ compras : comprado_como
    capitulos ||--o{ paginas : contem

    usuarios {
        int id PK
        string nome
        string email UK
        string cpf UK
        string senha
        boolean is_admin
        decimal total_gasto
        datetime createdAt
    }

    mangas {
        int id PK
        string nome
        int volume
        string capa_url
        decimal preco
        text descricao
        decimal avaliacao
    }

    livros {
        int id PK
        string nome
        string capa_url
        decimal preco
        text descricao
        decimal avaliacao
    }

    novels {
        int id PK
        string nome
        string capa_url
        decimal preco
        text descricao
        decimal avaliacao
    }

    compras {
        int id PK
        int usuario_id FK
        int produto_id
        string tipo_produto
        decimal preco_pago
        datetime createdAt
    }

    capitulos {
        int id PK
        int manga_id FK
        decimal numero
        string titulo
    }

    paginas {
        int id PK
        int manga_id FK
        int capitulo_id FK
        int numero_pagina
        string imagem_url
    }
2. Diagramas de Casos de Uso
Processo de Compra pelo Cliente
Snippet de código
graph LR
    classDef actor fill:#111,stroke:#fff,stroke-width:2px,color:#fff;
    classDef usecase fill:#222,stroke:#555,stroke-width:1px,color:#fff;

    Cliente((Cliente)):::actor

    subgraph "Kumoko Scan - E-commerce"
        UC1[Pesquisar Mangás, Livros e Novels]:::usecase
        UC2[Adicionar ao Carrinho]:::usecase
        UC3[Fazer Login]:::usecase
        UC4[Finalizar Compra]:::usecase
        UC5[Consultar Histórico de Leitura]:::usecase
    end

    Cliente --> UC1
    Cliente --> UC2
    Cliente --> UC4
    Cliente --> UC5

    UC4 -. "include" .-> UC3
    UC2 -. "include" .-> UC3
Gestão de Produtos pelo Administrador
Snippet de código
graph LR
    Admin((Administrador)):::actor

    subgraph "Painel Administrativo"
        UC_Login[Fazer Login Admin]
        UC_Gerenciar[Gerenciar Acervo]
        UC_Cadastrar[Cadastrar Nova Obra]
        UC_Editar[Editar Obra]
        UC_Excluir[Excluir Obra]
        UC_Upload[Upload de Imagem via Multer]
    end

    Admin --> UC_Gerenciar
    Admin --> UC_Cadastrar
    Admin --> UC_Editar
    Admin --> UC_Excluir

    UC_Gerenciar -. "include" .-> UC_Login
    UC_Cadastrar -. "include" .-> UC_Login
    UC_Editar -. "include" .-> UC_Login
    UC_Excluir -. "include" .-> UC_Login
    UC_Cadastrar -. "extend" .-> UC_Upload
3. Diagramas de Atividades
Processamento de Compra (Checkout)
Snippet de código
activityDiagram
    autonumber
    start
    :Acessar Carrinho;
    if "Usuario Autenticado?" then
      -> [Nao] :Fazer Login / Cadastro;
      :Retornar ao Carrinho;
      -> [Sim] :Visualizar Itens e Total;
    endif
    :Clica em Finalizar Compra;
    :Enviar dados para a API (/compras/finalizar);
    if "Backend Valida JWT e Precos?" then
      -> [Falha] :Exibir Alerta de Erro;
      :Tentar Novamente;
      -> [Sucesso] :Registrar Transacao no Banco;
      :Atualizar total_gasto do Usuario;
      :Limpar Carrinho Global;
      :Exibir Confirmacao de Sucesso;
      :Disponibilizar no Historico;
    endif
    stop
Fluxo de Cadastro de Produto pelo Administrador
Snippet de código
activityDiagram
    autonumber
    start
    :Acessar Painel Administrativo;
    :Solicitar Criacao de Produto;
    :Preencher Dados (Nome, Preco, Descricao);
    if "Dados Validos?" then
      -> [Falha] :Retornar Erro de Validacao;
      :Corrigir Dados;
      -> [Sucesso] :Enviar Imagem da Capa;
      :Processar Upload (Multer);
      :Salvar no Banco (Sequelize/MariaDB);
      :Retornar Sucesso;
      :Produto Disponivel no Catalogo;
    endif
    stop
4. Diagramas de Sequência
Autenticação de Usuário (Login)
Snippet de código
sequenceDiagram
    autonumber
    actor Cliente as App Mobile
    participant API as Node.js / Express
    participant DB as MariaDB

    Cliente->>API: POST /login { email, senha }
    API->>DB: SELECT * FROM usuarios WHERE email = ?
    DB-->>API: Retorna Usuario e Hash da Senha
    Note over API: Compara senha fornecida com Hash usando bcrypt
    alt Senha Incorreta
        API-->>Cliente: HTTP 401 Unauthorized
    else Senha Correta
        API-->>API: Gera Token JWT com validade
        API-->>Cliente: HTTP 200 OK + Token JWT
        Cliente->>Cliente: Salva Token no SecureStore
        Cliente->>Cliente: Redireciona para Home
    end
Adição ao Carrinho e Busca de Produtos
sequenceDiagram
    autonumber
    actor Cliente as App Mobile
    participant API as Node.js / Express
    participant DB as MariaDB

    Cliente->>API: GET /mangas (ou /livros)
    API->>DB: SELECT * FROM mangas
    DB-->>API: Retorna Lista de Obras
    API-->>Cliente: JSON de Produtos
    Cliente->>Cliente: Clica em Comprar (Salva no CartContext)
    Cliente->>API: POST /compras/finalizar { produtos, total }
    Note over API: Valida Token e recalcula total no servidor
    API->>DB: Insere registros na tabela 'compras'
    DB-->>API: Sucesso na Transacao
    API-->>Cliente: HTTP 200 OK (Compra Concluida)
Requisitos Funcionais
Autenticação e Usuários

RF01: O sistema deve permitir o cadastro de novos usuários (nome, e-mail, CPF e senha), garantindo que o e-mail e o CPF sejam únicos.

RF02: O sistema deve permitir login com e-mail e senha, gerando um token JWT.

RF03: O sistema deve permitir logout do usuário, removendo o token armazenado de forma segura.

RF04: O sistema deve suportar perfis de acesso distintos (Cliente e Administrador).

RF05: O sistema deve restringir o acesso a rotas administrativas por meio de middleware de autenticação e verificação de privilégios.

Produtos (Mangás, Livros e Novels)

RF06: O sistema deve permitir o cadastro de produtos com nome, volume, preço, descrição, avaliação e capa.

RF07: O sistema deve permitir a edição de produtos existentes.

RF08: O sistema deve permitir a exclusão de produtos e a remoção física de seus arquivos associados no servidor.

RF09: O sistema deve permitir a listagem de produtos.

RF10: O sistema deve permitir o anexo de arquivos de imagem no cadastro e edição de produtos via Multer.

Carrinho de Compras

RF11: O sistema deve permitir adicionar produtos ao carrinho global na memória do aplicativo (CartContext).

RF12: O sistema deve permitir alterar a quantidade de itens no carrinho.

RF13: O sistema deve permitir remover itens do carrinho.

RF14: O sistema deve calcular o valor total do carrinho automaticamente.

Compras e Histórico

RF15: O sistema deve permitir a finalização de um pedido a partir dos itens do carrinho autenticado.

RF16: O sistema deve recalcular os preços no servidor de forma segura, ignorando adulterações diretas no cliente.

RF17: O sistema deve registrar as transações na tabela de compras e atualizar o total gasto pelo usuário.

RF18: O sistema deve permitir a consulta do histórico de compras do usuário autenticado.

Painel Administrativo

RF19: O sistema deve fornecer rotas protegidas exclusivas para administradores gerenciarem o acervo.

Requisitos Não Funcionais
Segurança

RNF01: O sistema deve armazenar senhas de forma criptografada utilizando hash com a biblioteca bcrypt.

RNF02: O sistema deve utilizar autenticação baseada em token JWT.

RNF03: O sistema deve validar e autorizar rotas sensíveis via middlewares de segurança.

RNF04: O sistema deve limitar o tamanho (máximo 5MB) e os tipos de arquivos permitidos no upload de imagens via Multer.

Manutenibilidade e Arquitetura

RNF05: O código do backend deve ser escrito em TypeScript, utilizando tipagem estática.

RNF06: O backend deve seguir uma arquitetura em camadas bem definidas (controllers, models, routes, config).

RNF07: O sistema deve utilizar o Sequelize ORM para padronização do acesso ao banco de dados relacional MariaDB.

RNF08: O sistema deve possuir testes automatizados ponta a ponta (E2E) estruturados com Jest e Supertest.

Compatibilidade e Tecnologias

RNF09: O frontend mobile deve ser construído com React Native e Expo, garantindo compatibilidade com o sistema operacional Android.

RNF10: O backend deve ser desenvolvido em Node.js com Express, atuando como uma API RESTful independente.

RNF11: O banco de dados deve utilizar MariaDB para persistência estruturada das informações.
