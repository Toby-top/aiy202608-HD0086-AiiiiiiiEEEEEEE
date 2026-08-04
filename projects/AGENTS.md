# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
├── src/
│   ├── app/
│   │   ├── api/            # 后端 API 路由
│   │   │   ├── interview/  # 面试官对话 API（流式 LLM）
│   │   │   ├── asr/        # 语音识别 API
│   │   │   ├── tts/        # 语音合成 API
│   │   │   └── score/      # 评分 API（含批量评分 /score/batch）
│   │   ├── interview/      # 面试页面
│   │   ├── result/         # 结果页面（雷达图+评分详情）
│   │   ├── compare/        # 学生对比页面
│   │   ├── globals.css     # 全局样式
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 首页（选择面试类型）
│   ├── components/
│   │   ├── ui/             # Shadcn UI 组件库
│   │   ├── RadarChart.tsx  # 雷达图组件（支持单人/多人对比）
│   │   └── interview/      # 面试相关组件
│   ├── lib/
│   │   ├── utils.ts        # 通用工具函数
│   │   └── interview-prompt.ts  # 面试官系统提示词+评分标准
│   └── server.ts           # 自定义服务端入口
├── DESIGN.md               # 设计规范
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

## 核心功能

### 面试官对话 API (`/api/interview`)
- 使用 `coze-coding-dev-sdk` 的 `LLMClient` 实现流式对话
- 系统提示词定义在 `src/lib/interview-prompt.ts`
- 支持 SSE 流式输出
- 当 LLM 不可用时，自动降级为预设回复
- 包含10道核心面试题和5种追问策略
- 支持压力情境随机触发机制

### 评分 Agent API (`/api/score`)
- 使用 `coze-coding-dev-sdk` 的 `LLMClient` 实现智能评分
- 输入：面试对话记录 + 面试类型
- 输出：JSON 格式评分报告（6维度分数 + 评语 + 总分 + 等级）
- 当 LLM 不可用时，自动降级为预设评分算法
- 评分维度：逻辑表达(25%)、专业深度(20%)、抗压能力(15%)、沟通亲和力(15%)、自我认知(15%)、动机匹配(10%)

### 批量评分 API (`/api/score/batch`)
- 支持同时评分 2-10 个学生的面试记录
- 并行处理，返回每个学生的评分报告
- 用于学生对比功能

### 语音识别 API (`/api/asr`)
- 使用 `coze-coding-dev-sdk` 的 `ASRClient`
- 接收前端录音文件（FormData），返回识别文本
- 当服务不可用时，优雅降级

### 语音合成 API (`/api/tts`)
- 使用 `coze-coding-dev-sdk` 的 `TTSClient`
- 将文本转换为语音
- 当服务不可用时，优雅降级

## 面试类型
- Common App Interview（通用申请面试）
- Alumni Interview（校友面试）
- Initialview Interview（标准化面试）

## 评分维度（Day 2 实现）
1. 逻辑表达（25%） - A/B/C/D 四档评分
2. 专业深度（20%） - A/B/C/D 四档评分
3. 抗压能力（15%） - A/B/C/D 四档评分
4. 沟通亲和力（15%） - A/B/C/D 四档评分
5. 自我认知（15%） - A/B/C/D 四档评分
6. 动机匹配（10%） - A/B/C/D 四档评分

## 评分等级
- A级（9.0-10.0）：优秀，强烈推荐，优先录取
- B级（7.5-8.9）：良好，推荐，可以录取
- C级（6.0-7.4）：一般，需改进，候补/拒绝
- D级（1.0-5.9）：较差，不推荐，拒绝

## 压力情境机制
- 5种触发条件（回答笼统/矛盾/缺乏深度/长时间停顿/情绪紧张）
- 随机选择1-2个压力情境
- 5种追问话术，涵盖不同场景

## 开发规范

### 编码规范
- TypeScript strict 模式
- 禁止隐式 any
- 函数参数必须标注类型
- 使用 pnpm 管理依赖

### 样式规范
- 参考 DESIGN.md 中的设计规范
- 主色：深墨绿 `#1a3a2a`
- 辅助色：暖米白 `#f5f0e8`
- 点缀色：琥珀金 `#c9953c`
- 字体：Playfair Display + Inter + Noto Sans SC
