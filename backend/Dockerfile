# Go 后端
# 默认使用官方镜像；若某台服务器拉取慢，可在构建时覆盖：
#   docker build --build-arg GO_BUILDER_IMAGE=docker.m.daocloud.io/library/golang:1.22-alpine .
ARG GO_BUILDER_IMAGE=golang:1.22-alpine
ARG ALPINE_RUNTIME_IMAGE=alpine:3.19

FROM ${GO_BUILDER_IMAGE} AS builder
WORKDIR /app
# 使用国内 Go 模块代理，避免 proxy.golang.org 超时
ENV GOPROXY=https://goproxy.cn,direct
# 不安装 git，减少 apk 操作，避免磁盘 I/O 错误（Go 公共模块无需 git）
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM ${ALPINE_RUNTIME_IMAGE}
# 运行时固定使用国内 Alpine 镜像，避免先访问官方源超时后再回退
RUN sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://mirrors.aliyun.com/alpine|g' /etc/apk/repositories \
	&& apk add --no-cache ca-certificates tzdata ffmpeg
ENV TZ=Asia/Shanghai
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
