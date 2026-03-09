# 手机 App 打包指南

项目已集成 Capacitor，可打包成 **iOS** 和 **Android** 原生 App。

---

## 一、快速模式（推荐）

**无需改动代码**，App 直接加载你已部署的网站。适合已有阿里云部署的场景。

### 1. 前置条件

- 项目已在服务器部署并可通过网址访问（如 `https://你的域名.com` 或 `http://公网IP:3000`）
- 本机已安装 [Android Studio](https://developer.android.com/studio)（打包 Android）
- 若打包 iOS，需 **macOS + Xcode**（Windows 无法打包 iOS）

### 2. 配置部署地址

在项目根目录创建 `.env.local`（若已有可编辑），添加：

```bash
# 你的网站地址（必须是手机能访问的）
MOBILE_APP_URL=https://你的域名.com
# 若暂未配置 HTTPS，可临时用公网 IP：
# MOBILE_APP_URL=http://8.136.119.234:3000
```

运行 `npm run mobile:sync` 时会自动读取此变量。

Capacitor 会读取此变量，App 启动时直接加载该 URL。

### 3. 同步并打开 IDE

```bash
# 同步配置到原生项目
npm run mobile:sync

# 打开 Android Studio 打包 APK
npm run mobile:android
```

在 Android Studio 中：

1. 等待 Gradle 同步完成
2. 菜单 **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. 编译完成后，APK 位于 `android/app/build/outputs/apk/debug/app-debug.apk`

### 4. 真机安装

- 将 `app-debug.apk` 传到手机，直接安装即可
- 或 USB 连接手机，在 Android Studio 中点 Run 按钮安装

---

## 二、环境变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `MOBILE_APP_URL` | App 加载的网址（快速模式必填） | `https://yourdomain.com` |

不设置 `MOBILE_APP_URL` 时，Capacitor 会加载本地 `out` 目录（需先完成「完整模式」的静态导出构建）。

---

## 三、完整模式（静态导出）

若希望 App 使用本地打包的页面（更快加载、可离线缓存），需做静态导出。此模式需改动前端 API 调用方式。

### 1. 配置

在 `next.config.mobile.js` 中已写好导出配置。需在代码中增加 API 基础地址逻辑，将所有 `fetch('/api/...')` 改为使用 `process.env.NEXT_PUBLIC_APP_URL + '/api/...'`。

### 2. 构建

```bash
# 设置部署地址后构建静态资源
set NEXT_PUBLIC_APP_URL=https://你的域名.com
npx next build -c next.config.mobile.js

# 或使用 cross-env（跨平台）
npx cross-env NEXT_PUBLIC_APP_URL=https://你的域名.com next build -c next.config.mobile.js
```

### 3. 同步到原生项目

```bash
npm run mobile:sync
npm run mobile:android
```

---

## 四、iOS 打包（需 macOS）

在 Mac 上执行：

```bash
export MOBILE_APP_URL=https://你的域名.com
npm run mobile:sync
npm run mobile:ios
```

在 Xcode 中：

1. 选择开发团队（Signing & Capabilities）
2. 连接 iPhone 或选择模拟器
3. 点击 Run 运行，或 **Product → Archive** 打包上架

---

## 五、常见问题

### Q: 打开 App 显示空白？

- 检查 `MOBILE_APP_URL` 是否正确，手机能否访问该地址
- 若用 `http://`，确认 `capacitor.config.ts` 中 `cleartext: true` 已启用（iOS 需在 Info.plist 配置 Allow Arbitrary Loads）

### Q: Android 打包失败？

- 确认已安装 Android Studio 和 Android SDK
- 若提示 `sdk.dir` 未找到，在 `android/local.properties` 中添加：
  ```properties
  sdk.dir=C\:\\Users\\你的用户名\\AppData\\Local\\Android\\Sdk
  ```

### Q: 如何更换 App 图标？

- Android: 替换 `android/app/src/main/res/mipmap-*/ic_launcher.png`
- iOS: 替换 `ios/App/App/Assets.xcassets/AppIcon.appiconset/` 中的图标

---

## 六、项目结构

```
regr/
├── android/           # Android 原生工程
├── ios/               # iOS 原生工程
├── out/               # 静态资源（快速模式时为占位）
├── capacitor.config.ts
├── next.config.mobile.js   # 完整模式用
└── docs/MOBILE_APP.md
```
