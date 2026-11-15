# ADR-004: Nginx como gateway / proxy reverso único

- **Status:** Aceito
- **Data:** 2026-11-14

## Contexto

No legado a API Express e o MariaDB publicavam portas direto no host (3000 e 3306),
o Nginx existia apenas como arquivo de configuração fora do Compose e o frontend usava
URLs absolutas fixas (`https://kumokoscan.local/api`, `http://localhost:3000`). Com três
serviços, o navegador precisaria conhecer três origens, com CORS e TLS em cada uma.

## Decisão

Um container `gateway` (Nginx 1.27, build em `infra/nginx`) é o **único ponto de
entrada** e o único que publica portas (`8080 → 80`, `8443 → 443`):

- HTTP redireciona para HTTPS (exceto `/nginx-health`); certificado autoassinado gerado
  na subida se não existir (SAN `localhost`, `127.0.0.1` e `PUBLIC_HOST`).
- Roteamento por prefixo, sem reescrever o path (os serviços já usam o prefixo `/api`):

  | Location | Upstream |
  |---|---|
  | `/api/auth/`, `/api/users/` | `auth-service:3001` |
  | `/api/obras`, `/api/capitulos`, `/api/paginas`, `/api/catalog/` | `catalog-service:3002` |
  | `/api/pedidos`, `/api/orders/` | `order-service:3003` |
  | `/files/` | volume `uploads_data` (somente leitura, cache 7 dias, só GET) |
  | `/` | `frontend:80` |

- Segurança na borda: HSTS, CSP sem CDNs, `X-Frame-Options DENY`, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy`, `server_tokens off`, `client_max_body_size 10m`.
- Rate limit: zona `auth_limit` 10 r/min (burst 5) em `/api/auth/`; zona `api_limit`
  20 r/s (burst 40) em `/api/`.
- Correlação: gera/propaga `X-Request-Id`; log de acesso em JSON com upstream e tempos.
- Resiliência: `keepalive` nos upstreams, `proxy_connect_timeout 3s`,
  `proxy_read_timeout 30s`, `proxy_next_upstream` apenas para GET.
- `/health` e `/metrics` dos serviços não são roteados (acessíveis só na rede interna).

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| Expor cada serviço no host | Simples | CORS e TLS por serviço, superfície de ataque maior, front precisa de 3 URLs | Repete o problema do legado |
| Gateway em NestJS (BFF) | Mesma linguagem, agregação de chamadas | Mais um processo Node no caminho de toda requisição; servir arquivos estáticos fica pior | Sem necessidade de agregação |
| Traefik | Descoberta automática via labels | Configuração espalhada em labels; equipe já conhecia Nginx | Preferência por configuração explícita e versionada |
| Kong / API gateway completo | Plugins (auth, métricas) | Banco próprio ou modo declarativo; pesado | Desproporcional |

## Consequências

**Positivas**

- Mesma origem para SPA, API e imagens: o cookie `SameSite=Strict` funciona e o CORS
  fica restrito ao desenvolvimento local (`http://localhost:5173`).
- Arquivos estáticos (capas e páginas) servidos pelo Nginx com cache de 7 dias, sem
  passar pelo Node.
- Serviços internos invisíveis fora da rede `kumoko_net`.

**Negativas / trade-offs**

- Ponto único de entrada (mitigado com healthcheck e `restart: unless-stopped`).
- Mudanças de rota exigem alterar o Nginx e o contrato ao mesmo tempo.
- Certificado autoassinado gera aviso no navegador em ambiente local.

## Revisitar quando

- Houver domínio público: trocar o autoassinado por certificado ACME (Let's Encrypt).
- Houver múltiplas réplicas por serviço: declarar vários `server` por upstream ou
  usar resolução dinâmica (`resolver` do DNS do Docker).
