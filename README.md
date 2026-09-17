
# Kumoko Scan - E-commerce e Acervo de Obras

## Contextualização do Problema e Evolução do Produto

O projeto consiste no desenvolvimento de uma plataforma de comércio eletrônico voltada para a comercialização e leitura de mangás, livros e light novels.

A necessidade do sistema surgiu a partir da dificuldade de centralizar o acervo de publicações independentes e traduções. Inicialmente, o público e os leitores entravam em contato de forma descentralizada para verificar disponibilidade de volumes, lançamentos e informações sobre capítulos. Esse modelo gerava um atendimento manual, pouco escalável e com baixa organização.

Diante desse problema, o produto foi evoluindo ao longo do tempo para atender melhor às demandas do público e da operação do negócio.

### Primeira versão - Catálogo online
A primeira versão teve como objetivo principal disponibilizar o acervo de obras na internet, reduzindo a necessidade de contato direto para consultas simples. Foi desenvolvido um site que apresentava as obras disponíveis e suas capas, permitindo que o leitor consultasse previamente o catálogo.

No entanto, essa etapa ainda não oferecia um processo de compra integrado. Quando o usuário se interessava por uma obra, o fluxo dependia de contato externo para concluir a transação manualmente.

### Segunda versão - Implementação do e-commerce
A segunda versão surgiu para transformar o catálogo em uma plataforma de comércio eletrônico completa, permitindo que o cliente realizasse compras diretamente pelo sistema.

Nessa etapa, foi criada uma área administrativa, conhecida como "Painel do Administrador" ou "Mestre das Sombras", responsável por gerenciar todo o acervo. Foram implementadas funcionalidades essenciais para os clientes, como:

- Cadastro de usuários com validação de CPF e e-mail;
- Login e autenticação segura baseada em JWT;
- Gerenciamento de conta;
- Carrinho de compras global;
- Seleção de produtos e finalização de pedidos;
- Histórico de compras integrado ao banco de dados.

### Terceira versão - Expansão para dispositivos móveis
Na terceira versão, o objetivo foi ampliar o acesso à plataforma por meio de um aplicativo móvel desenvolvido com React Native e Expo. Isso permitiu que leitores navegassem pelo catálogo e realizassem compras diretamente pelo celular, com uma experiência nativa e responsiva.

---

## Arquitetura e Diagramas do Sistema

### 1. Diagrama Entidade-Relacionamento (DER)

```mermaid
erDiagram
    USUARIOS ||--o{ COMPRAS : realiza
    MANGAS ||--o{ CAPITULOS : possui
    MANGAS ||--o{ COMPRAS : comprado_como
    LIVROS ||--o{ COMPRAS : comprado_como
    NOVELS ||--o{ COMPRAS : comprado_como
    CAPITULOS ||--o{ PAGINAS : contem

    USUARIOS {
        int id PK
        string nome
        string email UK
        string cpf UK
        string senha
        boolean is_admin
        decimal total_gasto
        datetime createdAt
    }

    MANGAS {
        int id PK
        string nome
        int volume
        string capa_url
        decimal preco
        text descricao
        decimal avaliacao
    }

    LIVROS {
        int id PK
        string nome
        string capa_url
        decimal preco
        text descricao
        decimal avaliacao
    }

    NOVELS {
        int id PK
        string nome
        string capa_url
        decimal preco
        text descricao
        decimal avaliacao
    }

    COMPRAS {
        int id PK
        int usuario_id FK
        int produto_id
        string tipo_produto
        decimal preco_pago
        datetime createdAt
    }

    CAPITULOS {
        int id PK
        int manga_id FK
        decimal numero
        string titulo
    }

    PAGINAS {
        int id PK
        int manga_id FK
        int capitulo_id FK
        int numero_pagina
        string imagem_url
    }
```

### 2. Diagramas de Casos de Uso

#### Processo de Compra pelo Cliente

```mermaid
flowchart LR
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

    UC4 -. include .-> UC3
    UC2 -. include .-> UC3
```

#### Gestão de Produtos pelo Administrador

```mermaid
flowchart LR
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

    UC_Gerenciar -. include .-> UC_Login
    UC_Cadastrar -. include .-> UC_Login
    UC_Editar -. include .-> UC_Login
    UC_Excluir -. include .-> UC_Login
    UC_Cadastrar -. extend .-> UC_Upload
```

### 3. Diagramas de Atividades

#### Processamento de Compra (Checkout)

```mermaid
flowchart TD
    A[Acessar Carrinho] --> B{Usuário autenticado?}
    B -->|Não| C[Fazer login ou cadastro]
    C --> D[Retornar ao carrinho]
    B -->|Sim| E[Visualizar itens e total]
    E --> F[Clicar em Finalizar Compra]
    D --> F
    F --> G[Enviar dados para a API /compras/finalizar]
    G --> H{Backend valida JWT e preços?}
    H -->|Falha| I[Exibir alerta de erro]
    I --> J[Tentar novamente]
    J --> G
    H -->|Sucesso| K[Registrar transação no banco]
    K --> L[Atualizar total_gasto do usuário]
    L --> M[Limpar carrinho global]
    M --> N[Exibir confirmação de sucesso]
    N --> O[Disponibilizar no histórico]
```

#### Fluxo de Cadastro de Produto pelo Administrador

```mermaid
flowchart TD
    A[Acessar painel administrativo] --> B[Solicitar criação de produto]
    B --> C[Preencher dados do produto]
    C --> D{Dados válidos?}
    D -->|Não| E[Retornar erro de validação]
    E --> F[Corrigir dados]
    F --> C
    D -->|Sim| G[Enviar imagem da capa]
    G --> H[Processar upload com Multer]
    H --> I[Salvar no banco com Sequelize/MariaDB]
    I --> J[Retornar sucesso]
    J --> K[Produto disponível no catálogo]
```

### 4. Diagramas de Sequência

#### Autenticação de Usuário (Login)

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as App Mobile
    participant API as Node.js / Express
    participant DB as MariaDB

    Cliente->>API: POST /login { email, senha }
    API->>DB: SELECT * FROM usuarios WHERE email = ?
    DB-->>API: Retorna usuário e hash da senha
    Note over API: Compara a senha informada com o hash usando bcrypt
    alt Senha incorreta
        API-->>Cliente: HTTP 401 Unauthorized
    else Senha correta
        API-->>API: Gera token JWT com validade
        API-->>Cliente: HTTP 200 OK + Token JWT
        Cliente->>Cliente: Salva token no SecureStore
        Cliente->>Cliente: Redireciona para Home
    end
```

#### Adição ao Carrinho e Busca de Produtos

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as App Mobile
    participant API as Node.js / Express
    participant DB as MariaDB

    Cliente->>API: GET /mangas (ou /livros)
    API->>DB: SELECT * FROM mangas
    DB-->>API: Retorna lista de obras
    API-->>Cliente: JSON de produtos
    Cliente->>Cliente: Clica em Comprar e salva no CartContext
    Cliente->>API: POST /compras/finalizar { produtos, total }
    Note over API: Valida token e recalcula o total no servidor
    API->>DB: Insere registros na tabela compras
    DB-->>API: Sucesso na transação
    API-->>Cliente: HTTP 200 OK (Compra concluída)
```

## Requisitos Funcionais

1. Autenticação e Usuários

- RF01: O sistema deve permitir o cadastro de novos usuários com nome, e-mail, CPF e senha, garantindo que e-mail e CPF sejam únicos.
- RF02: O sistema deve permitir login com e-mail e senha, gerando um token JWT.
- RF03: O sistema deve permitir logout do usuário, removendo o token armazenado de forma segura.
- RF04: O sistema deve suportar perfis de acesso distintos, como Cliente e Administrador.
- RF05: O sistema deve restringir o acesso a rotas administrativas por meio de middleware de autenticação e verificação de privilégios.

2. Produtos (Mangás, Livros e Novels)

- RF06: O sistema deve permitir o cadastro de produtos com nome, volume, preço, descrição, avaliação e capa.
- RF07: O sistema deve permitir a edição de produtos existentes.
- RF08: O sistema deve permitir a exclusão de produtos e a remoção física dos arquivos associados no servidor.
- RF09: O sistema deve permitir a listagem de produtos.
- RF10: O sistema deve permitir o envio de imagens no cadastro e edição de produtos por meio do Multer.

3. Carrinho de Compras

- RF11: O sistema deve permitir adicionar produtos ao carrinho global na memória do aplicativo, por meio do CartContext.
- RF12: O sistema deve permitir alterar a quantidade de itens no carrinho.
- RF13: O sistema deve permitir remover itens do carrinho.
- RF14: O sistema deve calcular o valor total do carrinho automaticamente.

4. Compras e Histórico

- RF15: O sistema deve permitir a finalização de um pedido a partir dos itens do carrinho autenticado.
- RF16: O sistema deve recalcular os preços no servidor de forma segura, ignorando adulterações diretas no cliente.
- RF17: O sistema deve registrar as transações na tabela de compras e atualizar o total gasto pelo usuário.
- RF18: O sistema deve permitir a consulta do histórico de compras do usuário autenticado.

5. Painel Administrativo

- RF19: O sistema deve fornecer rotas protegidas exclusivas para administradores gerenciarem o acervo.

## Requisitos Não Funcionais

1. Segurança

- RNF01: O sistema deve armazenar senhas de forma criptografada utilizando hash com a biblioteca bcrypt.
- RNF02: O sistema deve utilizar autenticação baseada em token JWT.
- RNF03: O sistema deve validar e autorizar rotas sensíveis por meio de middlewares de segurança.
- RNF04: O sistema deve limitar o tamanho e os tipos de arquivos permitidos no upload de imagens via Multer, com máximo de 5MB e extensões válidas.

2. Manutenibilidade e Arquitetura

- RNF05: O código do backend deve ser escrito em TypeScript, utilizando tipagem estática.
- RNF06: O backend deve seguir uma arquitetura em camadas bem definidas, com controllers, models, routes e config.
- RNF07: O sistema deve utilizar o Sequelize ORM para padronizar o acesso ao banco de dados relacional MariaDB.
- RNF08: O sistema deve possuir testes automatizados de ponta a ponta (E2E) estruturados com Jest e Supertest.

3. Compatibilidade e Tecnologias

- RNF09: O frontend mobile deve ser construído com React Native e Expo, garantindo compatibilidade com Android.
- RNF10: O backend deve ser desenvolvido em Node.js com Express, atuando como uma API RESTful independente.
- RNF11: O banco de dados deve utilizar MariaDB para persistência estruturada das informações.

---

## Visão Geral do Projeto

O Kumoko Scan foi pensado como uma plataforma completa para a gestão e comercialização de obras digitais e físicas dentro de um ecossistema de leitura e acervo. A solução une catálogo, autenticação, carrinho, compras e painel administrativo em uma estrutura que atende tanto ao cliente quanto ao administrador.

A proposta do projeto vai além de um simples e-commerce: ela oferece uma experiência de leitura e organização do acervo, com foco em mangás, livros e novels, e integra diferentes camadas do sistema em uma arquitetura moderna e escalável.

