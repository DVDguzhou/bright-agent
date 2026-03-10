/**
 * 手机 App 构建配置（静态导出）
 * 用法: NEXT_PUBLIC_APP_URL=https://你的域名.com next build -p 3001
 * 或: 先 npm run build:mobile
 *
 * 注意：静态导出后 /api 请求会发往 NEXT_PUBLIC_APP_URL，需确保前后端已部署
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: '.next-mobile',
  images: { unoptimized: true },
  trailingSlash: true,
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  // 静态导出时无服务端，/api 需用绝对地址；在代码中用 NEXT_PUBLIC_APP_URL
};

module.exports = nextConfig;
