# Go 后端（使用国内镜像）
FROM docker.m.daocloud.io/library/golang:1.22-alpine AS builder
WORKDIR /app
# 使用国内 Go 模块代理，避免 proxy.golang.org 超时
ENV GOPROXY=https://goproxy.cn,direct
# 不安装 git，减少 apk 操作，避免磁盘 I/O 错误（Go 公共模块无需 git）
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM docker.m.daocloud.io/library/alpine:3.19
# 国内构建：避免 dl-cdn.alpinelinux.org 极慢
RUN sed -i 's|https://dl-cdn.alpinelinux.org|https://mirrors.aliyun.com|g' /etc/apk/repositories \
	&& apk add --no-cache ca-certificates tzdata ffmpeg
ENV TZ=Asia/Shanghai
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
