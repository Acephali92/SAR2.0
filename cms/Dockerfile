# Redaktions-Backend (Payload 3 / Next.js). Multi-stage Build fuer ein schlankes Runtime-Image.
FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# cms/ hat (noch) kein public/-Verzeichnis; ohne es scheitert unten "COPY --from=builder /app/public".
RUN mkdir -p public
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S payload && adduser -S payload -G payload
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
RUN mkdir -p /data/uploads && chown -R payload:payload /data/uploads
USER payload
EXPOSE 3000
# Wendet vor dem Start alle ausstehenden Migrationen an (cms/src/migrations/) - sonst bekommt ein
# frischer Produktionsserver kein Datenbankschema, da NODE_ENV=production Payloads automatisches
# "Push" deaktiviert (siehe docs/REDAKTION-TODO.md, "LAUNCH-BLOCKER").
CMD ["sh", "-c", "npx payload migrate && npm run start"]
