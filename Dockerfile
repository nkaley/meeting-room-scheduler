# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/ 
RUN npm ci

COPY . .
RUN npx prisma generate
RUN cp /app/node_modules/prisma/build/*.wasm /app/node_modules/.bin/ 2>/dev/null || true; \
    cp /app/node_modules/@prisma/prisma-schema-wasm/*.wasm /app/node_modules/.bin/ 2>/dev/null || true
RUN npm run build

# Production stage (standalone)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
