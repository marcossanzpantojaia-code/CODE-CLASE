# syntax=docker/dockerfile:1.7
# Base image is overridable (e.g. a registry mirror when Docker Hub rate-limits).
ARG NODE_IMAGE=node:22-bookworm-slim
# ---- build -------------------------------------------------------------------
FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json tsconfig.build.json ./
COPY scripts ./scripts
COPY src ./src
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

# ---- runtime -----------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node config/tenant.example.json ./config/tenant.example.json
USER node
EXPOSE 3000
# Liveness only: readiness (/health/ready) belongs to the orchestrator/load balancer.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Run migrations as a release step: `node dist/cli/index.js migrate`
CMD ["node", "dist/main.js"]
