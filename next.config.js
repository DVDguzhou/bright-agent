/** @type {import('next').NextConfig} */
const nextConfig = {
  // 前后端分离：/api 请求代理到 Go 后端
  async rewrites() {
    const apiTarget = process.env.API_BACKEND_URL || "http://localhost:8080";
    return [{ source: "/api/:path*", destination: `${apiTarget}/api/:path*` }];
  },
  // 启用压缩与优化
  compress: true,
  poweredByHeader: false,
  // 预取链接以提升导航速度
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
};

module.exports = nextConfig;
