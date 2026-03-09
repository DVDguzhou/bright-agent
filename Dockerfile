# 多阶段构建 - Next.js 前端（使用国内镜像）
FROM docker.m.daocloud.io/library/node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM docker.m.daocloud.io/library/node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# API_BACKEND_URL 在 docker-compose 中通过 build-arg 传入，或运行时通过 env 注入
ARG API_BACKEND_URL
ENV API_BACKEND_URL=${API_BACKEND_URL}
# 生成 Prisma Client（含 InvocationTokenStatus 等类型）
RUN npx prisma generate
RUN npm run build

FROM docker.m.daocloud.io/library/node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
