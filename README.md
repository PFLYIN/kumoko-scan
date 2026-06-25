# 🕷️ Kumoko Scan - Plataforma de Scanlation

Uma plataforma web moderna, rápida e segura para gerenciamento, tradução e publicação de mangás e light novels. Desenvolvida com foco na experiência do usuário, a plataforma consolida o fluxo de criação em uma interface única, inspirada na usabilidade direta de grandes catálogos.

## 🚀 Tecnologias e Arquitetura

O ecossistema é orquestrado por contêineres e dividido em microsserviços para garantir escalabilidade e segurança:

* **Frontend:** React + Vite (Interface fluida e componentizada)
* **Backend:** Node.js + Express (API RESTful)
* **Banco de Dados:** MariaDB + Sequelize ORM (Relacional e persistente)
* **Infraestrutura:** Docker & Docker Compose
* **Proxy Reverso e Segurança:** Nginx (HTTPS, HSTS, CSP Estrita)
* **Qualidade e Testes:** Jest + Supertest (Testes End-to-End) + Husky (Git Hooks)

## 🛡️ Segurança Implementada (Cybersecurity)

Este projeto segue rigorosas diretrizes de segurança:
* **Headers de Segurança Nginx:** Proteção contra Clickjacking (`X-Frame-Options`), MIME-sniffing e injeção de scripts (XSS).
* **HTTPS e HSTS:** Tráfego forçado via porta 443 com certificados SSL locais.
* **Isolamento de Rede (Docker Network):** Banco de dados e Backend operam em rede interna cega, inacessíveis pelo mundo exterior. Apenas o Nginx responde a requisições externas.
* **Autenticação JWT:** Tokens assinados dinamicamente com segredos protegidos por variáveis de ambiente.

## ⚙️ Como Executar o Projeto Localmente

### 1. Configuração do Ambiente
Crie o arquivo de variáveis de ambiente baseando-se no exemplo fornecido para não expor credenciais:
```bash
cp .env.example .env