export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Kumoko Scan API",
    version: "1.0.0",
    description: "Documentação da API do sistema Kumoko Scan (Tech Academy 5).",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor Local"
    }
  ],
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
                  nome: { type: "string", example: "Kumoko Aranha" },
                  email: { type: "string", example: "kumoko@scan.com" },
                  cpf: { type: "string", example: "52998561018" },
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
                  email: { type: "string", example: "kumoko@scan.com" },
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
    }
  }
};

export default swaggerDocument;