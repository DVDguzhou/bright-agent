import type { CapacitorConfig } from '@capacitor/cli';
import { config as loadEnv } from 'dotenv';

loadEnv();
loadEnv({ path: '.env.local', override: true });

/**
 * 手机 App 配置
 *
 * 快速模式：设置环境变量 MOBILE_APP_URL 为你的部署地址（如 https://你的域名.com）
 *          App 将直接加载该网址，无需构建静态资源
 *
 * 本地开发：不设置 MOBILE_APP_URL 时，使用 next export 生成的 out 目录
 */
const appUrl = process.env.MOBILE_APP_URL;

const config: CapacitorConfig = {
  appId: 'com.yourname.agentmarketplace',
  appName: 'Agent 市场',
  // 快速模式(有 MOBILE_APP_URL)用 public；完整模式用静态导出的 out
  webDir: appUrl ? 'public' : 'out',
  // 当配置了部署地址时，App 直接加载远程网址（零代码改动）
  ...(appUrl && {
    server: {
      url: appUrl,
      cleartext: appUrl.startsWith('http://'),
    },
  }),
  plugins: {
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
