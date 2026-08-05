# AI 国际高中面试辅导系统

> 面向准备国际高中与海外升学面试的学生，提供 AI 模拟面试、语音对话、即时追问、六维度评分报告和多学生对比复盘。

🏆 **AIY 黑客松 2026 深圳站** 参赛作品  
🏷 命题企业 / 赛道：Coze  
👤 团队：AiiiiiiiEEEEEEE  
🔢 团队编号：HD0086

---

## 👥 团队分工

| 成员 | 负责 |
| --- | --- |
| 关复毅 | Coze 平台搭建、Agent 配置、技能调用、API 对接 |
| 黄泽涛 | 提示词设计、面试场景定义、测试用例、文档撰写 |
| 刘㬢羽 | 用户界面、语音交互、报告展示、前端开发 |
| 李豪 | 功能测试、用户体验、文档撰写、演示准备 |

## ✨ 它能做什么

- 支持 3 种面试类型：Common App Interview、Alumni Interview、Initialview Interview。
- 提供 AI 面试官对话，根据学生回答进行连续追问和面试节奏控制。
- 支持语音输入、浏览器语音识别兜底和面试官语音播放。
- 从逻辑表达、专业深度、抗压能力、沟通亲和力、自我认知、匹配动机 6 个维度生成评分。
- 用雷达图展示单个学生的能力画像，帮助学生快速定位优势和短板。
- 支持多学生横向对比，便于老师或团队进行批量复盘。

## 🎬 演示

项目主应用位于 [`projects/`](./projects) 目录。

本地运行后访问：

```text
http://localhost:5000
```

部署到 Cloudflare 后，可将线上访问地址补充在这里：

```text
https://your-project.your-subdomain.workers.dev
```

## 🛠 用到的技术 / AI 工具

- Coze
- Codex
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Chart.js / react-chartjs-2
- DeepSeek API
- OpenNext for Cloudflare
- Cloudflare Workers / Pages Functions Runtime
- Wrangler

## 🚀 怎么跑起来

环境要求：

- Node.js 20+
- pnpm 9+

下载仓库后，先进入项目目录，再安装依赖并启动开发服务。

### macOS / Linux

```bash
cd <仓库文件夹> # 一个你喜欢的地方，用于放下载下来的文件
git clone git@github.com:Toby-top/aiy202608-HD0086-AiiiiiiiEEEEEEE.git
cd projects
corepack enable
corepack pnpm install
corepack pnpm dev
```

启动后访问：

```text
http://localhost:5000
```

### Windows

在 PowerShell 中运行：

```powershell
cd <仓库文件夹> # Same same~ 也是一个你喜欢的地方，用来放下载下来的仓库文件
git clone git@github.com:Toby-top/aiy202608-HD0086-AiiiiiiiEEEEEEE.git
cd projects
corepack enable
corepack pnpm install
corepack pnpm dev
```

启动后访问：

```text
http://localhost:5000
```

如果 Windows 提示无法执行脚本，可以先运行：

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

常用检查命令：

```bash
corepack pnpm ts-check
corepack pnpm lint
corepack pnpm lint:style
corepack pnpm cf:build
```

Cloudflare 本地预览：

```bash
cd projects
cp .dev.vars.example .dev.vars
corepack pnpm cf:preview
```

完整部署教程见 [`projects/docs/cloudflare-pages-functions-deploy.md`](./projects/docs/cloudflare-pages-functions-deploy.md)。

## 📌 后续计划

- 接入更稳定的服务端 ASR/TTS 能力，提升不同浏览器和设备上的语音体验。
- 增加老师端班级管理和学生历史报告归档。
- 扩充国际高中与海外升学面试题库，按学校、项目和难度分类。
- 优化评分解释，让学生获得更具体的表达改进建议。

---

## 📄 版权与许可

Copyright (c) 2026 关复毅、黄泽涛、刘㬢羽、李豪

本作品由以上团队成员共同完成，采用 [MIT License](./LICENSE) 开源，使用请保留版权与许可声明。

> 本项目为 AIY 黑客松参赛作品，作品归团队所有；AIY 组委会仅作收录与展示。