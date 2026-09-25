# Сборка сайта (jet-front-main) для боевого сервера.
# Адреса (API, SITE и др.) Next.js вшивает в код при сборке, поэтому они передаются как build-аргументы.
FROM node:22-alpine AS build
WORKDIR /app
ARG API
ARG SITE
ARG IS_HTTPS=true
ARG RECAPTCHA_SITE_KEY=
ARG MAIN_URL
ENV API=$API SITE=$SITE IS_HTTPS=$IS_HTTPS IS_DEVELOPMENT=false DISABLE_CACHE=false \
    RECAPTCHA_SITE_KEY=$RECAPTCHA_SITE_KEY MAIN_URL=$MAIN_URL NEXT_TELEMETRY_DISABLED=1 HUSKY=0
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs
COPY --from=build --chown=nextjs:nodejs /app ./
USER nextjs
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
