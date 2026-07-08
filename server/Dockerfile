# eOffice backend API (Express + Prisma/SQLite + JWT).
# Single-stage for reliability: keeps the Prisma CLI + tsx available at runtime so the
# entrypoint can run `prisma migrate deploy` and (optionally) seed. Can be slimmed to a
# multi-stage prod-deps-only image later.
FROM node:20-bookworm-slim

# Prisma needs openssl at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps (devDeps included so prisma CLI + tsx are present for migrate/seed).
COPY package*.json ./
RUN npm ci

# Generate the Prisma client, then compile the TypeScript.
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

COPY docker-entrypoint.sh ./
# Strip any CRLF (Windows checkout) so the shebang works in the Linux container, then chmod.
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
