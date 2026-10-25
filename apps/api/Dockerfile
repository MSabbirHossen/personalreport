FROM node:22-alpine AS builder

WORKDIR /app

# Copy monorepo dependency manifests
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Clean install all dependencies
RUN npm ci

# Copy configuration and source files
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

# Build shared package and API server
RUN npm run build -w packages/shared
RUN npm run build -w apps/api

# Prune development dependencies
RUN npm prune --production

# --- Production Runtime Image ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install curl for container healthcheck
RUN apk add --no-cache curl

# Run as non-root user for security hardening
USER node

# Copy production artifacts and pruned node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node packages/shared/package.json ./packages/shared/
COPY --chown=node:node packages/shared/dist ./packages/shared/dist
COPY --chown=node:node apps/api/package.json ./apps/api/
COPY --chown=node:node apps/api/dist ./apps/api/dist
COPY --chown=node:node node_modules ./node_modules

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "apps/api/dist/index.js"]
