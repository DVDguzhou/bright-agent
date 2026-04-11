/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // Docker 部署需要
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
    ];
  },
};

module.exports = nextConfig;
