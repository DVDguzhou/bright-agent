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

## 四、GitHub Actions 自动构建 iOS（无需 Mac）

项目已配置 `.github/workflows/ios-build.yml`，推送到 GitHub 后可在云端自动构建 iOS App。

### 4.1 模拟器构建（无需证书）

推送代码到 `main` 或 `master` 分支后，工作流自动运行，生成 **模拟器版 .app**。在 Actions 页面下载 `ios-simulator-app` 产物即可验证构建是否成功。

### 4.2 IPA 构建（需 Apple 开发者账号）

要生成可安装到真机的 **.ipa**，需先配置：

**Variables**（Settings → Secrets and variables → Actions → Variables）：
- `MOBILE_APP_URL`：你的网站地址（如 `https://你的域名.com`），不配置则使用默认 `http://8.136.119.234:3000`
- `BUILD_IPA_ENABLED`：设为 `true` 时启用 IPA 构建（需已配置下方证书 Secrets）

**Secrets**（Settings → Secrets and variables → Actions → Secrets）：

| Secret | 说明 |
|--------|------|
| `BUILD_CERTIFICATE_BASE64` | Apple Distribution 证书 .p12 的 Base64 编码 |
| `P12_PASSWORD` | 导出 .p12 时设置的密码 |
| `BUILD_PROVISION_PROFILE_BASE64` | 描述文件 .mobileprovision 的 Base64 编码 |
| `KEYCHAIN_PASSWORD` | 临时密钥链密码（任意字符串） |
| `APPLE_PROFILE_NAME` | （可选）描述文件名称，默认 "Agent 市场" |

**获取证书和描述文件**（需在 Mac 或云 Mac 上操作一次）：

1. **证书**：Xcode → Settings → Accounts → Manage certificates → + → Apple Distribution，导出为 .p12
2. **描述文件**：打开 [Apple Developer Profiles](https://developer.apple.com/account/resources/profiles/list) → 新建 App Store 描述文件 → 选择 App ID 和证书 → 下载 .mobileprovision

**Base64 编码**（在 Mac 终端执行）：

```bash
base64 -i 你的证书.p12 | pbcopy    # 粘贴到 BUILD_CERTIFICATE_BASE64
base64 -i 你的描述文件.mobileprovision | pbcopy   # 粘贴到 BUILD_PROVISION_PROFILE_BASE64
```

配置完成并推送到 GitHub 后，在 Actions 中下载 `ios-ipa` 产物，即可得到可安装的 .ipa 文件。

---

## 五、iOS 本地打包（需 Mac）

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

## 六、常见问题

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

### Q: iOS 构建失败，提示 "CAPPluginCall has no member 'reject'"？

- capacitor-swift-pm（SPM）的 `CAPPluginCall` 不提供 `reject` 方法，与 @capacitor/app 不兼容。
- 项目已通过 `patches/@capacitor+app+8.0.1.patch` 修复：将 `call.reject()` 替换为返回空值的 `call.resolve()`。
- 升级 @capacitor/app 时需检查 patch 是否仍适用，必要时重新生成：修改后执行 `npx patch-package @capacitor/app`。

### Q: 地图页在 App 里无法使用 GPS？

- Web 端地图使用浏览器 `navigator.geolocation`；在 Capacitor WebView 中通常可用，但若系统未授权或行为不一致，可改为使用官方插件：
  1. 安装：`npm i @capacitor/geolocation`，执行 `npx cap sync`。
  2. **Android**：在 `AndroidManifest.xml` 中声明 `ACCESS_FINE_LOCATION`（及按需的 `ACCESS_COARSE_LOCATION`），并在运行时请求权限。
  3. **iOS**：在 `Info.plist` 增加 `NSLocationWhenInUseUsageDescription`（说明为何需要定位）。
- 若仍加载远程 `MOBILE_APP_URL`，需保证站点为 **HTTPS**（或 iOS ATS 已放行），否则浏览器定位可能受限。

---

## 七、项目结构

```
regr/
├── android/           # Android 原生工程
├── ios/               # iOS 原生工程
├── out/               # 静态资源（快速模式时为占位）
├── capacitor.config.ts
├── next.config.mobile.js   # 完整模式用
└── docs/MOBILE_APP.md
```
