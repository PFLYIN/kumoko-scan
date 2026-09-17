# Kumoko Scan - E-commerce e Acervo de Obras

## Contextualização do Problema e Evolução do Produto

O projeto consiste no desenvolvimento de uma plataforma de comércio eletrônico voltada para a comercialização e leitura de mangás, livros e light novels.

A necessidade do projeto surgiu a partir da dificuldade de centralizar o acervo de publicações independentes e traduções. Inicialmente, o público e os leitores entravam em contato de forma descentralizada para consultar a disponibilidade de volumes, lançamentos e informações sobre os capítulos. Esse modelo gerava um fluxo de atendimento manual pouco escalável.

Diante desse problema, o produto passou por diferentes versões ao longo de seu desenvolvimento, buscando solucionar gradualmente as necessidades identificadas.

### Primeira versão - Catálogo online
A primeira versão teve como principal objetivo disponibilizar as informações do acervo na internet e reduzir a necessidade de contato direto para consultas básicas. Foi desenvolvido um site que apresentava as obras disponíveis e suas capas. Dessa forma, o leitor podia consultar previamente o catálogo.

Entretanto, nessa primeira versão ainda não existia um processo de compra integrado. Caso o usuário tivesse interesse em adquirir uma obra física ou digital, o fluxo dependia de direcionamentos externos para conclusão manual.

### Segunda versão - Implementação do e-commerce
A segunda versão surgiu com o objetivo de transformar o catálogo em uma plataforma de comércio eletrônico propriamente dita, permitindo que o cliente realizasse o processo de compra diretamente pelo sistema.

Nessa etapa, foi desenvolvida uma área administrativa (Painel do Administrador / Mestre das Sombras), permitindo o gerenciamento completo do acervo. Foram implementadas funcionalidades essenciais para os clientes, incluindo:
- Cadastro de usuários com validação de CPF e e-mail;
- Login e autenticação segura baseada em tokens JWT;
- Gerenciamento de conta;
- Carrinho de compras global;
- Seleção de produtos e finalização de pedidos;
- Histórico de compras integrado ao banco de dados.

### Terceira versão - Expansão para dispositivos móveis
Na terceira versão, o objetivo foi expandir o acesso à plataforma por meio de um aplicativo móvel desenvolvido em React Native e Expo, permitindo que os leitores naveguem pelo acervo e realizem compras diretamente pelo celular de forma nativa e responsiva.

---

## Arquitetura e Diagramas do Sistema

### 1. Diagrama Entidade-Relacionamento (DER)
```mermaid
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