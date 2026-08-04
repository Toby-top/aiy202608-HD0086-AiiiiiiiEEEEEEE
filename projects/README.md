# AI 国际高中面试辅导系统

AI 国际高中面试辅导系统是一套面向国际高中学生的模拟面试与评估工具。系统通过 AI 面试官还原海外大学面试场景，支持语音输入、实时追问、面试记录保存、6 维度评分报告和多学生横向对比，帮助学生在正式申请面试前进行高强度练习与复盘。

## 功能清单

- 3 种面试类型：Common App Interview、Alumni Interview、Initialview Interview。
- AI 面试官：基于系统提示词进行分阶段提问、追问和压力情境模拟。
- 6 维度评分：逻辑表达、专业深度、抗压能力、沟通亲和力、自我认知、匹配动机。
- 雷达图报告：用 Chart.js 展示单次面试的多维评分表现。
- 学生对比：支持选择 2-10 个学生进行批量评分、雷达图对比、表格对比和 CSV/JSON 导出。
- 语音能力：支持 ASR 语音识别输入与 TTS 面试官语音合成。

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Chart.js / react-chartjs-2
- coze-coding-dev-sdk

## API 接口列表

| 接口 | 方法 | 用途 | 输入 | 返回 |
| --- | --- | --- | --- | --- |
| `/api/interview` | `POST` | 面试官流式对话接口 | `messages`、`interviewType` | `text/event-stream`，流式返回 `{ content }`，结束为 `[DONE]` |
| `/api/score` | `POST` | 单学生评分接口 | `messages`、`interviewType` | `scores`、`totalScore`、`grade`、`summary`、`strengths`、`improvements` |
| `/api/score/batch` | `POST` | 批量评分对比接口 | `students: StudentRecord[]` | `{ results: StudentScore[] }` |
| `/api/asr` | `POST` | 语音识别接口 | `multipart/form-data`，字段 `audio` | `{ text, duration }` |
| `/api/tts` | `POST` | 语音合成接口 | `text` | `{ audioUri, audioSize }` |

## 快速启动指南

### 环境要求

- Node.js 20+
- pnpm 9+

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

启动后访问 [http://localhost:5000](http://localhost:5000) 查看应用。

### 常用命令

```bash
pnpm ts-check
pnpm lint
pnpm build
pnpm start
```

## 项目结构

```text
docs/
├── prompts/       # 面试官系统提示词、评分标准等文档
├── requirements/  # 需求文档
└── test-cases/    # 测试用例

src/
├── app/           # Next.js App Router 页面与 API
├── components/    # React 组件
└── lib/           # 面试提示词、评分维度和工具函数
```

## 团队分工说明

- A - 产品经理：负责需求拆解、面试流程设计、评分维度定义和验收标准。
- B - Agent 开发者：负责面试官系统提示词、评分提示词、AI 调用和降级策略。
- C - 前端：负责页面交互、语音录制、雷达图、报告展示和学生对比体验。
- D - 测试：负责测试用例、接口联调、异常场景验证和回归检查。
