FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install dependencies
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY .npmrc ./

RUN pnpm install --frozen-lockfile --prod

# Install dev dependencies for build
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY .npmrc ./

RUN pnpm install --frozen-lockfile

COPY prisma ./prisma/
COPY . ./

RUN npx prisma generate

# Build the application
FROM builder AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/server ./.next/server
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
