# Админка jet.su: Payload CMS 3 + Next.js
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# Сборка. Этот же этап используется для служебных команд (импорт тестовых данных, миграции).
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3001 HOSTNAME=0.0.0.0 MEDIA_DIR=/app/media
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs && mkdir -p /app/media && chown nextjs:nodejs /app/media
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/src/contract/fixtures ./src/contract/fixtures
USER nextjs
EXPOSE 3001
# миграции базы применяются сами при запуске
CMD ["node", "server.js"]
