FROM node:20-alpine AS base
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace manifests + lockfile
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/
COPY services/api/package.json ./services/api/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/db ./packages/db
COPY services/api ./services/api
COPY tsconfig.base.json ./

EXPOSE 3001

CMD ["pnpm", "--filter", "@stashr/api", "dev"]
