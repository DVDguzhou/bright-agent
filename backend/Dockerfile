# Go 后端（使用国内镜像）
FROM docker.m.daocloud.io/library/golang:1.22-alpine AS builder
WORKDIR /app
# 使用国内 Go 模块代理，避免 proxy.golang.org 超时
ENV GOPROXY=https://goproxy.cn,direct
RUN apk add --no-cache git
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM docker.m.daocloud.io/library/alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
