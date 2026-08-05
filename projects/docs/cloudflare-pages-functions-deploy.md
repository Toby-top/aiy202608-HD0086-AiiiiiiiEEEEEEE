# Cloudflare 部署教程

本项目是 Next.js App Router 应用，包含动态页面和 `/api/*` Route Handlers。普通静态导出无法覆盖这些 API，因此部署到 Cloudflare 时使用 OpenNext for Cloudflare，把 Next.js 应用适配为 Cloudflare 运行时，静态资源由 assets 提供，动态页面和 API 由 Cloudflare Functions/Worker 处理。

## 1. 已调整的项目结构

```text
projects/
├── open-next.config.ts       # OpenNext Cloudflare 适配配置
├── wrangler.jsonc            # Cloudflare 运行时、资源和兼容性配置
├── .dev.vars.example         # 本地 Cloudflare 预览环境变量模板
├── next.config.ts            # Next 配置，已接入 OpenNext dev 初始化
├── src/app/api/              # Next Route Handlers，部署后由 Cloudflare 运行时承载
├── src/app/                  # 页面路由
└── public/                   # 静态资源
```

构建后会生成：

```text
.open-next/
├── worker.js                 # Cloudflare 动态运行入口
└── assets/                   # 静态资源目录
```

这些生成目录已经放入 `.gitignore`，不要提交。

## 2. 本地准备

```bash
cd projects
corepack pnpm install
```

复制本地 Cloudflare 环境变量模板：

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`：

```env
DEEPSEEK_API_KEY=你的 DeepSeek Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

服务端 ASR/TTS 默认不配置，部署后会使用浏览器语音识别和浏览器语音播放兜底。

## 3. 本地 Cloudflare 预览

```bash
corepack pnpm cf:preview
```

这个命令会先运行：

```bash
opennextjs-cloudflare build
```

再运行：

```bash
wrangler dev
```

预览地址通常是：

```text
http://localhost:8787
```

## 4. 登录 Cloudflare

```bash
corepack pnpm wrangler login
```

浏览器会打开 Cloudflare 授权页，登录并授权 Wrangler。

## 5. 配置生产环境变量

部署后的 API 会从 Cloudflare runtime 环境读取变量，也就是代码里的 `process.env.DEEPSEEK_API_KEY`。如果你已经在 Cloudflare Dashboard 里配置了 key，不需要把 key 写进仓库，也不需要写进 `wrangler.jsonc`。

方式 A：用 Wrangler 命令写入 secret。

```bash
corepack pnpm wrangler secret put DEEPSEEK_API_KEY
```

然后按提示粘贴 key。

非敏感变量可以在 Cloudflare 控制台设置，也可以用 Wrangler：

```bash
corepack pnpm wrangler secret put DEEPSEEK_BASE_URL
corepack pnpm wrangler secret put DEEPSEEK_MODEL
```

推荐值：

```text
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

方式 B：Cloudflare 控制台设置。

1. 打开 Cloudflare Dashboard。
2. 进入 Workers & Pages。
3. 找到项目 `ai-interview`。
4. 打开 Settings。
5. 在 Variables and Secrets 添加：
   - `DEEPSEEK_API_KEY`
   - `DEEPSEEK_BASE_URL`
   - `DEEPSEEK_MODEL`

## 6. 部署

```bash
corepack pnpm cf:deploy
```

项目里的 `cf:deploy` 已经带上 `-- --keep-vars`，用于保留 Cloudflare Dashboard 中配置的 Variables and Secrets。不要去掉这个参数，否则部署时可能覆盖线上环境变量，导致 DeepSeek 实时回复读不到 key。

等命令完成后，终端会显示部署 URL。

## 7. 如果要通过 Cloudflare Pages 控制台连接 GitHub

如果老师要求从 Pages 控制台连 GitHub，可以这样填：

| 配置项 | 值 |
| --- | --- |
| Framework preset | None |
| Root directory | `projects` |
| Build command | `corepack enable && corepack pnpm install --frozen-lockfile && corepack pnpm cf:build` |
| Build output directory | `.open-next/assets` |

注意：完整 Next.js 动态 API 不只是静态 assets。当前更推荐使用 `wrangler deploy` / `opennextjs-cloudflare deploy`，它会同时部署 `.open-next/worker.js` 和 assets。若 Pages 控制台只上传静态目录，`/api/interview`、`/api/score`、`/api/asr`、`/api/tts` 这些接口不会正常工作。

## 8. 常见问题

### 麦克风/摄像头在部署后能用吗？

能。Cloudflare 默认提供 HTTPS，浏览器允许 HTTPS 页面请求麦克风和摄像头。局域网 HTTP 地址则通常不允许。

### ASR/TTS 怎么处理？

项目已经做了降级：

- ASR 服务未配置时，会返回清晰错误。
- 前端会尽量使用浏览器语音识别兜底。
- TTS 服务未配置时，会回退到浏览器语音播放。

### 为什么不使用纯 Cloudflare Pages 静态导出？

因为项目包含动态路由和 API：

- `/api/interview`
- `/api/score`
- `/api/score/batch`
- `/api/asr`
- `/api/tts`
- `/interview/[type]`
- `/result/[id]`
- `/report/[id]`

这些需要运行时，不能只靠静态文件。

### 部署前检查命令

```bash
corepack pnpm ts-check
corepack pnpm lint
corepack pnpm lint:style
corepack pnpm cf:build
```
