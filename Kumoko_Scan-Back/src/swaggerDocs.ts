export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Kumoko Scan API",
    version: "1.0.0",
    description: "Documentação completa da API do sistema Kumoko Scan (Tech Academy 5).",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor Local"
    }
  ],
  // 🎯 ADICIONADO: Configuração do Cadeado (Token JWT) no Swagger
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    "/register": {
      post: {
        summary: "Cadastra um novo usuário",
        tags: ["Autenticação"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nome: { type: "string", example: "Pedro Diego" },
                  email: { type: "string", example: "pedrodiego@gmail.com" },
                  cpf: { type: "string", example: "13480682995" },
                  senha: { type: "string", example: "senhaForte123" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Usuário cadastrado com sucesso!" },
          "400": { description: "Erro de validação (E-mail, CPF ou Senha)." }
        }
      }
    },
    "/login": {
      post: {
        summary: "Realiza o login e retorna o Token JWT",
        tags: ["Autenticação"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", example: "admin@dark.com" },
                  senha: { type: "string", example: "senhaForte123" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Login com sucesso. Retorna o Token." },
          "401": { description: "Senha incorreta." },
          "404": { description: "E-mail não encontrado." }
        }
      }
    },
    // 🎯 ADICIONADO: Rotas de Mangás
    "/mangas": {
      get: {
        summary: "Listar todos os mangás do acervo",
        tags: ["Mangás"],
        responses: { "200": { description: "Sucesso" } }
      },
      post: {
        summary: "Cadastrar um novo mangá (Apenas Mestre das Sombras)",
        tags: ["Mangás"],
        security: [{ bearerAuth: [] }], // Exige o Token
        responses: { "201": { description: "Mangá cadastrado com sucesso" } }
      }
    },
    // 🎯 ADICIONADO: Rotas de Livros
    "/livros": {
      get: {
        summary: "Listar todos os livros do acervo",
        tags: ["Livros"],
        responses: { "200": { description: "Sucesso" } }
      },
      post: {
        summary: "Cadastrar um novo livro (Apenas Mestre das Sombras)",
        tags: ["Livros"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Livro cadastrado com sucesso" } }
      }
    },
    // 🎯 ADICIONADO: Rotas de Novels
    "/novels": {
      get: {
        summary: "Listar todas as novels do acervo",
        tags: ["Novels"],
        responses: { "200": { description: "Sucesso" } }
      },
      post: {
        summary: "Cadastrar uma nova novel (Apenas Mestre das Sombras)",
        tags: ["Novels"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Novel cadastrada com sucesso" } }
      }
    },
    // 🎯 ADICIONADO: Rotas de Compras e Histórico
    "/compras/finalizar": {
      post: {
        summary: "Finaliza o carrinho de compras do usuário",
        tags: ["Compras"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  produtos: { type: "array", items: { type: "object" } },
                  total: { type: "number" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Compra finalizada com sucesso" } }
      }
    },
    "/compras/historico": {
      get: {
        summary: "Retorna o histórico de compras do usuário logado",
        tags: ["Compras"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Lista de compras devolvida" } }
      }
    }
  }
};

export default swaggerDocument;