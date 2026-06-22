# 多阶段构建 - Next.js 前端
# 默认使用官方镜像；若某台服务器拉取慢，可在构建时覆盖：
#   docker build --build-arg NODE_BASE_IMAGE=docker.m.daocloud.io/library/node:20-alpine .
ARG NODE_BASE_IMAGE=node:20-alpine

FROM ${NODE_BASE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

FROM ${NODE_BASE_IMAGE} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run postinstall
# API_BACKEND_URL 在 docker-compose 中通过 build-arg 传入，或运行时通过 env 注入
ARG API_BACKEND_URL
ENV API_BACKEND_URL=${API_BACKEND_URL}
# 登录页可选方式（默认关闭微信/手机，仅邮箱）
ARG NEXT_PUBLIC_LOGIN_SHOW_WECHAT=false
ARG NEXT_PUBLIC_LOGIN_SHOW_PHONE=false
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
ARG NEXT_PUBLIC_CDN_URL=
ENV NEXT_PUBLIC_LOGIN_SHOW_WECHAT=${NEXT_PUBLIC_LOGIN_SHOW_WECHAT}
ENV NEXT_PUBLIC_LOGIN_SHOW_PHONE=${NEXT_PUBLIC_LOGIN_SHOW_PHONE}
ENV NEXT_PUBLIC_POSTHOG_KEY=${NEXT_PUBLIC_POSTHOG_KEY}
ENV NEXT_PUBLIC_POSTHOG_HOST=${NEXT_PUBLIC_POSTHOG_HOST}
ENV NEXT_PUBLIC_CDN_URL=${NEXT_PUBLIC_CDN_URL}
# 生成 Prisma Client（含 InvocationTokenStatus 等类型）
RUN npx prisma generate
RUN npm run build

FROM ${NODE_BASE_IMAGE} AS runner
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
