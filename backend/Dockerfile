# syntax=docker/dockerfile:1
# Imagem unica para os 3 microsservicos. Escolha o app com --build-arg APP=<nome>:
#   docker build --build-arg APP=auth-service -t kumoko/auth-service ./backend
# Apps validos: auth-service | catalog-service | order-service

ARG NODE_IMAGE=node:22-alpine

# 1) Dependencias completas (inclui devDependencies para compilar)
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 2) Build do app escolhido (webpack via Nest CLI -> dist/apps/<APP>/main.js)
FROM deps AS build
ARG APP
RUN test -n "$APP" || (echo "Informe --build-arg APP=<auth-service|catalog-service|order-service>" && exit 1)
COPY . .
RUN npx nest build "$APP"

# 3) Somente dependencias de producao
FROM ${NODE_IMAGE} AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# 4) Runtime enxuto, usuario nao-root
FROM ${NODE_IMAGE} AS runtime
ARG APP
ENV NODE_ENV=production \
    APP_NAME=${APP}
WORKDIR /app

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --from=build --chown=node:node /app/dist/apps/${APP} ./dist/apps/${APP}
# Capas de exemplo usadas pelo seed do catalog-service (pequeno; copiado para todos os apps).
COPY --chown=node:node apps/catalog-service/seed ./seed

# Volume de uploads (montado no catalog-service) precisa pertencer ao usuario node.
RUN mkdir -p /app/uploads && chown node:node /app/uploads

USER node

# O healthcheck fica no docker-compose (wget em /health na porta de cada servico).
CMD ["sh", "-c", "exec node dist/apps/${APP_NAME}/main.js"]
