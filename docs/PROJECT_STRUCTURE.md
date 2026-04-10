# 项目结构总览

这份文档用于快速理解仓库结构，减少“文件在哪”“该从哪里开始看”的成本。

## 从哪里开始

- 想本地跑起来：看 `docs/MINIMAL_SETUP.md`
- 想了解产品定位：看 `PROJECT_README.md` 和 `docs/buyandsell.md`
- 想看前后端关系：看 `docs/FRONTEND_BACKEND_SEPARATION.md`
- 想跑完整测试链路：看 `docs/TEST_GUIDE.md`
- 想找脚本用途：看 `scripts/README.md`

## 顶层目录

| 路径 | 作用 |
|------|------|
| `src/` | Next.js 前端页面、组件、前端 API 路由、共享库 |
| `backend/` | Go API 服务、后端业务逻辑、后端脚本 |
| `prisma/` | Prisma schema、迁移、种子数据 |
| `docs/` | 项目文档、测试文档、部署文档、研究资料 |
| `scripts/` | 本地开发、测试、Agent 调用、内容生成脚本 |
| `public/` | 静态资源、PWA 文件、封面资源 |
| `android/` | Capacitor Android 工程 |
| `ios/` | Capacitor iOS 工程 |
| `agents/` | 独立 Agent 示例 |
| `voice_samples/` | 声音参考样本 |
| `patches/` | `patch-package` 补丁 |

## 关键入口文件

| 文件 | 作用 |
|------|------|
| `README.md` | 仓库简要入口 |
| `PROJECT_README.md` | 产品主说明与快速开始 |
| `package.json` | 前端依赖与 npm 脚本入口 |
| `next.config.js` | Next.js 配置与 `/api` 代理 |
| `middleware.ts` | 根路径与路由中间件逻辑 |
| `.env.example` | 本地环境变量示例 |
| `docker-compose.production.yml` | 生产部署编排 |
| `backend/README.md` | Go 后端说明 |
| `prisma/schema.prisma` | 数据模型与数据库配置 |

## 前端结构

- `src/app/`: 页面、路由、App Router API
- `src/components/`: 通用组件、导航、卡片、语音 UI
- `src/lib/`: 业务工具、接口适配、搜索、鉴权等
- `src/hooks/`: 手势、语音、交互相关 hooks
- `src/contexts/`: 全局上下文，例如认证
- `src/types/`: 类型定义

## 后端结构

- `backend/main.go`: Go 服务入口
- `backend/internal/handler/`: HTTP 接口处理
- `backend/internal/lifeagent/`: 人生 Agent 相关核心逻辑
- `backend/internal/db/`: 数据库连接
- `backend/internal/models/`: 数据结构
- `backend/internal/tts/`: 语音合成相关能力
- `backend/scripts/`: Go 侧维护/导入脚本

## 文档结构

- `docs/MINIMAL_SETUP.md`: 最小本地启动
- `docs/TEST_GUIDE.md`: 手把手功能流程测试
- `docs/TEST_DOCUMENT.md`: 全量测试清单
- `docs/DEPLOYMENT.md`: 部署主文档
- `docs/PRODUCTION_ENV.md`: 生产环境变量
- `docs/FRONTEND_BACKEND_SEPARATION.md`: 前后端架构
- `docs/VERTICAL_CASE_RESEARCH.md`: 垂直案例研究的规范版本

## 检索建议

- 找页面：先看 `src/app/`
- 找接口：先搜 `src/app/api/` 和 `backend/internal/handler/`
- 找数据结构：先看 `prisma/schema.prisma` 和 `backend/internal/models/`
- 找脚本：先看 `scripts/README.md`
- 找部署：先看 `docs/DEPLOYMENT.md`

## 约定

- 文档入口统一以 `README.md`、`PROJECT_README.md`、`docs/README.md` 为准
- 垂直案例研究以 `docs/VERTICAL_CASE_RESEARCH.md` 为准
- 临时排障、乱码修复、编码转换类文件不再放在仓库根目录
