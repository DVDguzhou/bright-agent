/** @type {import('next').NextConfig} */
const cdnOrigin = (process.env.NEXT_PUBLIC_CDN_URL ?? "").replace(/\/+$/, "");

const nextConfig = {
  output: "standalone", // Docker 部署需要
  // JS/CSS/图片等构建产物走 CDN；须等 CDN 域名「正常运行」且 HTTPS 就绪后再配置 NEXT_PUBLIC_CDN_URL 并构建
  ...(cdnOrigin ? { assetPrefix: cdnOrigin } : {}),
  // 用户上传图片 URL 解析见 src/lib/cdn.ts
  // 前后端分离：/api 请求代理到 Go 后端
  async rewrites() {
    const apiTarget = process.env.API_BACKEND_URL || "http://localhost:8080";
    // fallback: 先匹配 src/app/api/ 下的自定义 route，没有才走代理到 Go 后端
    return {
      fallback: [
        { source: "/api/:path*", destination: `${apiTarget}/api/:path*` },
      ],
    };
  },
  // 关闭 Next.js 内置压缩（SSE 流式响应需要逐块发送，压缩会导致缓冲）
  // 如需压缩可在前置 nginx 层处理，并排除 text/event-stream
  compress: false,
  poweredByHeader: false,
  // 预取链接以提升导航速度
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/life-agent-cover-presets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/downloads/:path*.apk",
        headers: [
          { key: "Content-Type", value: "application/vnd.android.package-archive" },
          {
            key: "Content-Disposition",
            value: 'attachment; filename="brightagent.apk"',
          },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
