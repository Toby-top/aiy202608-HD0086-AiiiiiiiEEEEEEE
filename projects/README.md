# AI 国际高中面试辅导系统
> 帮国际高中申请者进行高仿真英文面试练习、即时追问与复盘评分

🏆 **AIY 黑客松 2026 深圳站** 参赛作品  
🏷 命题企业 / 赛道：【Coze · 智能体方向】  
👤 团队：【AiiiiiiiEEEEEEE】  
🔢 团队编号：【HD0086】（组委会分配）

---

# 👥 团队分工

| 成员 | 负责 |
|---|---|
| A | 产品设计、面试流程设计、评分维度定义 |
| B | AI 面试官提示词、DeepSeek 对话与转写润色流程 |
| C | 前端界面、录音回放、设备测试、移动端交互 |
| D | 测试验收、演示材料、异常场景验证 |

# ✨ 它能做什么

- 模拟 3 类国际学校 / 留学申请面试：Common App、Alumni Interview、Initialview。
- AI 面试官会根据学生回答继续追问，而不是机械播放固定题库。
- 支持浏览器麦克风录音、录音回放、摄像头预览和设备测试。
- 使用浏览器实时转写学生回答，并交给 DeepSeek 做轻量纠错、补标点和语句整理。
- 自动生成 6 维度面试评分：逻辑表达、专业深度、抗压能力、沟通亲和力、自我认知、动机匹配。
- 生成可复盘的面试报告，支持雷达图展示、聊天记录回看和多学生横向对比。

# 🎬 演示

![产品截图](./public/hero-interview.png)

🔗 在线体验：【把作品的外网访问网址贴这里，让人能直接点开玩；没有就删掉这一行】

# 🛠 用到的技术 / AI 工具

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS + shadcn/ui + lucide-react
- DeepSeek：AI 面试官对话、评分生成、浏览器转写文本润色
- Web Speech API：浏览器实时语音转写
- MediaRecorder / Web Audio API：麦克风录音、音量检测、录音回放
- Chart.js / react-chartjs-2：评分雷达图
- OpenNext + Cloudflare Workers / Wrangler：部署适配

# 🚀 怎么跑起来

环境要求：Node.js 20+、pnpm 9+

```bash
corepack pnpm install
corepack pnpm dev
```

开发服务默认运行在：

```text
http://localhost:5000
```

如果需要启用 DeepSeek 能力，请在 `.dev.vars` 或部署环境变量中配置：

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

部署到 Cloudflare 后，API 会读取 Cloudflare Dashboard 中配置的 Variables and Secrets。项目的 `cf:deploy` 脚本已带 `--keep-vars`，用于保留线上配置的 `DEEPSEEK_API_KEY`。

常用检查命令：

```bash
corepack pnpm ts-check
corepack pnpm lint:build
corepack pnpm build
```

# 📌 后续计划

- 接入正式服务端 ASR，将完整录音转写作为浏览器实时转写的补强方案。
- 增加面试结束后的逐题反馈，标注回答亮点、跑题点和可追问风险。
- 增加更多学校 / 项目画像，让 AI 面试官风格更贴近不同院校。
- 支持历史报告云端保存，方便学生、老师和顾问共同复盘。
- 增加演示视频、公开体验链接和移动端录制稳定性优化。

---

# 📄 版权与许可

本作品版权归 **AiiiiiiiEEEEEEE 团队成员** 共同所有，采用 [MIT License](./LICENSE) 开源，使用请署名。

> 本项目为 AIY 黑客松参赛作品，作品归团队所有；AIY 组委会仅作收录与展示。
