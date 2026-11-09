# ADR-001: iniciar com monólito modular

- **Estado:** aceito como direção inicial; validar após escolher a API ativa.
- **Contexto:** o projeto tem interface web, API e persistência, mas ainda não há
  necessidade comprovada de escalar ou publicar domínios de forma independente.
- **Decisão:** manter uma API implantável e separar o código em módulos de domínio
  com contratos claros. Não iniciar com microserviços.
- **Consequências positivas:** operação e transações mais simples; menos custo de
  infraestrutura; limites podem ser testados antes de uma extração.
- **Consequências negativas:** exige disciplina para evitar dependências cruzadas e
  um módulo monolítico sem fronteiras.
- **Revisitar quando:** houver gargalo de escala independente, necessidade de
  disponibilidade/autonomia diferente ou equipe capaz de operar serviços separados.
- **Nota:** `kumoko-backend` contém um repositório aninhado separado. Esta decisão
  não escolhe se ele substitui `Kumoko_Scan-Back`.
