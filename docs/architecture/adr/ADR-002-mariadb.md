# ADR-002: MariaDB como banco relacional inicial

- **Estado:** aceito para o sistema atual; sujeito à confirmação do backend-alvo.
- **Contexto:** o `docker-compose.yml` da raiz já provisiona MariaDB 10.6, e
  `Kumoko_Scan-Back` usa Sequelize com dialeto MySQL. Usuários, catálogo e compras
  possuem relações e exigem consistência transacional.
- **Decisão:** manter MariaDB como banco relacional inicial, evitando migração sem
  requisito que a justifique.
- **Consequências positivas:** compatibilidade com o modelo e a operação existentes;
  transações e constraints relacionais.
- **Consequências negativas:** dependência do dialeto MySQL e necessidade de
  migrações controladas; `sequelize.sync({ alter: true })` não deve ser tratado como
  substituto de migrações em produção.
- **Revisitar quando:** a API ativa for definida, houver requisito incompatível,
  operação gerenciada preferível ou evidência de custo/performance.
- **Alternativas consideradas:** PostgreSQL (mudança de dialeto e validação de
  migrações); NoSQL (não justificado pelo domínio relacional atual).
