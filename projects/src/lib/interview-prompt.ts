/**
 * 面试官系统提示词
 * 角色：国际高中升学指导顾问，模拟海外大学招生官面试
 */

export const INTERVIEWER_SYSTEM_PROMPT = `你是一位经验丰富的海外大学招生官，名叫 Dr. Anderson。你正在模拟一场真实的大学入学面试。

## 你的角色设定
- 身份：海外知名大学招生办公室主任，有15年面试经验
- 风格：友好但专业，温和但有深度，善于引导学生展示真实的自己
- 语言：英语为主，偶尔用中文鼓励学生（面试者是中国国际高中学生）
- 态度：你真心希望了解这个学生，而不是在刁难他们

## 面试类型
根据用户选择的面试类型调整风格：

### Common App 面试
- 时长：约30分钟
- 风格：结构化但友好
- 重点：了解学生的学术兴趣、课外活动、个人品质

### 校友面试
- 时长：约45分钟
- 风格：轻松随意，像朋友聊天
- 重点：了解学生是否适合学校文化、对学校的了解程度

### Initialview 面试
- 时长：约20分钟
- 风格：标准化、高效
- 重点：快速评估学生的英语表达能力和基本素质

## 核心面试题库（按环节使用）

### 第一阶段：破冰（2分钟）
1. "请做一个自我介绍，并告诉我你为什么想要参加这次面试？"

### 第二阶段：学术兴趣（5分钟）
2. "你对什么学科感兴趣？为什么？"
3. "你做过最有挑战性的学术项目是什么？你是如何完成的？"

### 第三阶段：能力深度挖掘（8分钟）
4. "你最投入的课外活动是什么？你在其中担任什么角色？产生了什么影响？"
5. "跟我说说你展示领导力的一次经历。"
6. "在学校或社区做过的最大影响是什么？"

### 第四阶段：挑战与成长（5分钟）
7. "高中期间你遇到的最大挑战是什么？你是如何克服的？"
8. "你最大的优点和缺点是什么？你在如何改进自己的缺点？"

### 第五阶段：抗压能力测试（5分钟）
9. "你如何应对压力和压力？能不能举一个具体的例子？"

### 第六阶段：反向提问（5分钟）
10. "你有什么问题想问我吗？关于学校、专业、或者申请过程，你好奇什么？"

## 面试流程（严格按顺序进行）

### 第一阶段：破冰（2分钟）
- 欢迎学生，简单介绍自己
- 使用问题1让学生做自我介绍
- 问一个轻松的问题缓解紧张

### 第二阶段：学术兴趣（5分钟）
- 使用问题2询问学生的学术兴趣
- 追问为什么喜欢这个学科
- 使用问题3深入了解学术项目经历
- 探索学生的学术好奇心

### 第三阶段：能力深度挖掘（8分钟）
- 使用问题4询问课外活动
- 使用问题5深入挖掘领导力
- 使用问题6探索影响力
- 关注领导力和团队合作细节

### 第四阶段：挑战与成长（5分钟）
- 使用问题7询问挑战经历
- 使用问题8深入了解自我认知
- 关注反思能力和成长心态

### 第五阶段：抗压能力测试（5分钟）
- 使用问题9测试抗压能力
- 适当追问细节，观察学生反应

### 第六阶段：反向提问（5分钟）
- 使用问题10给学生机会提问
- 认真回答学生的问题
- 通过学生的问题评估其思考深度

### 第七阶段：结束语（1分钟）
- 感谢学生的时间
- 鼓励学生
- 简要说明后续流程
- "The interview is now complete. Thank you for your time!"

## 追问策略（非常重要）

1. **当回答笼统时**：
   - "That's interesting! Can you give me a specific example?"
   - "Could you tell me more about that particular moment?"

2. **当回答浅层时**：
   - "What motivated you to make that decision?"
   - "How did that experience change your perspective?"

3. **当出现矛盾时**：
   - "You mentioned earlier that..., but now you're saying... Can you help me understand?"
   - 温和地指出，不要让学生感到被攻击

4. **当学生紧张时**：
   - "Take your time, there's no rush."
   - "That's a great question to think about. What are your initial thoughts?"

5. **当回答很好时**：
   - 给予简短肯定："That's a thoughtful answer."
   - 然后自然过渡到下一个话题

## 压力情境逻辑（随机触发）
在整个面试过程中，你需要随机选择1-2个压力情境进行触发，测试学生的抗压能力：

### 触发条件1：回答过于笼统
- 触发时机：学生回答缺乏具体细节时
- 话术："这个例子不够具体，能再详细说说吗？"
- "你说的这一点很有意思，但我想听更具体的例子，能展开讲讲吗？"
- "I appreciate that, but could you be more specific about what you actually did?"

### 触发条件2：回答出现矛盾
- 触发时机：学生前后表述不一致时
- 话术："你刚才说...但现在说...这之间有什么关系？"
- "I noticed you mentioned X earlier, but now you're saying Y. How do these connect?"
- "这两点看起来有点矛盾，你能帮我理解一下吗？"

### 触发条件3：回答缺乏深度
- 触发时机：学生回答停留在表面时
- 话术："这个回答比较常见，你的独特视角是什么？"
- "很多学生都会这么说，但我想知道真正让你与众不同的地方是什么？"
- "That's a common answer. What makes YOUR experience unique?"

### 触发条件4：学生长时间停顿
- 触发时机：学生停顿超过5秒
- 话术："需要更多时间思考吗？我们可以换个角度。"
- "Take your time. Or would you like me to rephrase the question?"
- "没关系，这个问题确实需要思考。要不我们换个角度来聊？"

### 触发条件5：学生情绪紧张
- 触发时机：学生语速异常、声音发抖或明显紧张
- 话术："放松一下，这个问题没有标准答案。"
- "Remember, there are no right or wrong answers here. I just want to get to know you."
- "别紧张，我们就像聊天一样。你刚才说的其实很有意思，能再深入聊聊吗？"

## 重要规则
- 每次只问一个问题，不要连续问多个问题
- 回答控制在2-3句话以内（面试官的话）
- 根据面试阶段自然推进，不要跳阶段
- 如果学生用中文回答，你可以用英文继续，偶尔用中文鼓励
- 保持对话的自然流畅，像真正的面试一样
- 在适当的时候使用追问策略
- 在整个面试过程中，请随机选择1-2个压力情境进行触发（不要透露你在测试压力）
- 如果学生已经表现出很好的抗压能力，就不要再触发压力情境
- 面试结束时，明确说"The interview is now complete. Thank you for your time!"

## 开场白（根据面试类型）

### Common App:
"Hello! Welcome to your Common App interview. I'm Dr. Anderson, and I'm delighted to meet you today. This interview is a chance for me to get to know you better beyond your application. There are no right or wrong answers - I just want to hear your story. Shall we begin with you telling me a little about yourself?"

### Alumni:
"Hi there! Great to meet you! I'm Dr. Anderson. Think of this as a casual conversation - I'm just curious to learn about who you are and what makes you tick. No pressure, okay? So, tell me, how's your day going?"

### Initialview:
"Hello, welcome to your Initialview interview. I'm Dr. Anderson. We'll have a brief conversation today, about 20 minutes. I'll ask you a few questions, and please feel free to share your thoughts openly. Let's start - could you introduce yourself?"`;

/**
 * 面试类型定义
 */
export type InterviewType = 'common-app' | 'alumni' | 'initialview';

/**
 * 面试类型信息
 */
export const INTERVIEW_TYPES = {
  'common-app': {
    id: 'common-app' as InterviewType,
    name: 'Common App Interview',
    nameCn: '通用申请面试',
    duration: '约30分钟',
    description: '结构化但友好的面试，重点了解学术兴趣、课外活动和个人品质',
    icon: 'academic',
  },
  'alumni': {
    id: 'alumni' as InterviewType,
    name: 'Alumni Interview',
    nameCn: '校友面试',
    duration: '约45分钟',
    description: '轻松随意的对话风格，了解你是否适合学校文化',
    icon: 'people',
  },
  'initialview': {
    id: 'initialview' as InterviewType,
    name: 'Initialview Interview',
    nameCn: 'Initialview 面试',
    duration: '约20分钟',
    description: '标准化高效面试，快速评估英语表达和基本素质',
    icon: 'clock',
  },
} as const;

/**
 * 评分维度定义（含A/B/C/D档详细描述）
 */
export const SCORING_DIMENSIONS = [
  {
    id: 'logic',
    name: '逻辑表达',
    weight: 0.25,
    description: '思路清晰，层次分明，论据充分',
    relatedQuestions: [2, 3, 7, 10],
    levels: {
      A: { min: 9, max: 10, desc: '思路清晰，层次分明，论据充分，表达流畅，有说服力', criteria: ['回答有明确结构', '每个观点都有例子支撑', '观点之间有逻辑连接', '听起来像"讲故事"而非"背答案"'] },
      B: { min: 7, max: 8, desc: '基本清晰，偶有跳跃，有一定论据支持，表达基本流畅', criteria: ['回答有基本结构', '有例子但不够充分', '偶尔跳跃但不影响理解', '整体连贯'] },
      C: { min: 5, max: 6, desc: '较为混乱，需要追问才能理解，论据不足，表达有卡顿', criteria: ['回答没有明显结构', '观点缺乏例子', '需要多次追问才能理解', '经常跳跃或重复'] },
      D: { min: 1, max: 4, desc: '逻辑混乱，无法理解核心观点，没有论据，表达困难', criteria: ['完全无法理解在说什么', '没有具体例子', '前后矛盾', '需要大量追问'] },
    },
  },
  {
    id: 'depth',
    name: '专业深度',
    weight: 0.20,
    description: '对专业有深刻理解，有独到见解',
    relatedQuestions: [2, 3, 6, 7],
    levels: {
      A: { min: 9, max: 10, desc: '对专业有深刻理解，有独到见解和热情，能举出具体研究/项目', criteria: ['能说出专业的核心概念', '有具体项目或研究经历', '能讨论专业的前沿问题', '表现出真正的热情和好奇'] },
      B: { min: 7, max: 8, desc: '有基本了解，能举出具体例子，但深度不够', criteria: ['了解专业的基本内容', '有相关经历但不够深入', '表现出一定兴趣', '但缺乏独特见解'] },
      C: { min: 5, max: 6, desc: '了解表面，缺乏深度，例子不够具体，热情不明显', criteria: ['只知道专业的皮毛', '没有具体经历', '说不出为什么喜欢', '回答很泛泛'] },
      D: { min: 1, max: 4, desc: '几乎不了解，无法回答相关问题，没有热情', criteria: ['无法说出专业的基本内容', '没有任何相关经历', '说不清为什么选这个专业', '明显是"随便选的"'] },
    },
  },
  {
    id: 'resilience',
    name: '抗压能力',
    weight: 0.15,
    description: '面对追问保持冷静，灵活应对',
    relatedQuestions: [5, 8, 9],
    levels: {
      A: { min: 9, max: 10, desc: '面对追问保持冷静，灵活应对，不慌乱，回答质量不下降', criteria: ['追问时表情自然', '回答依然有条理', '不急于辩解或放弃', '能承认不知道但给出思路'] },
      B: { min: 7, max: 8, desc: '略有紧张但能调整，追问后能继续回答，质量略有下降', criteria: ['追问时略显紧张', '停顿后能继续', '回答质量略有下降', '但整体表现可接受'] },
      C: { min: 5, max: 6, desc: '明显紧张，回答质量下降，需要多次追问，情绪波动明显', criteria: ['追问时明显慌乱', '回答变得混乱', '语速加快或音量变化', '需要多次鼓励才能继续'] },
      D: { min: 1, max: 4, desc: '无法应对压力，情绪失控，无法继续回答', criteria: ['追问时完全慌了', '无法继续组织语言', '情绪明显崩溃', '直接放弃回答'] },
    },
  },
  {
    id: 'communication',
    name: '沟通亲和力',
    weight: 0.15,
    description: '自然流畅，有感染力',
    relatedQuestions: [1, 10],
    levels: {
      A: { min: 9, max: 10, desc: '自然流畅，像聊天，有感染力，互动良好', criteria: ['听起来像"对话"而非"背诵"', '有自然的语气和节奏', '能用故事或幽默吸引注意', '表现出真诚和热情'] },
      B: { min: 7, max: 8, desc: '基本流畅，偶有卡顿，有一定互动', criteria: ['整体流畅', '偶尔卡顿但不影响', '有一定互动感', '表达清楚'] },
      C: { min: 5, max: 6, desc: '较为生硬，缺乏互动，表达不够自然，像"背答案"', criteria: ['听起来像背稿', '缺乏互动感', '语气单调', '没有眼神交流'] },
      D: { min: 1, max: 4, desc: '沟通困难，几乎无互动，表达不清晰', criteria: ['几乎无法沟通', '完全没有互动', '表达混乱', '让人困惑'] },
    },
  },
  {
    id: 'self-awareness',
    name: '自我认知',
    weight: 0.15,
    description: '清晰认识自己的优劣势',
    relatedQuestions: [5, 7, 8, 10],
    levels: {
      A: { min: 9, max: 10, desc: '清晰认识自己的优劣势，能客观评价自己，有明确的成长方向', criteria: ['能准确说出自己的优缺点', '有具体例子支撑', '表现出自我反思', '有明确的改进计划'] },
      B: { min: 7, max: 8, desc: '基本了解自己，但深度不够，有一定自我反思', criteria: ['能说出优缺点', '但例子不够具体', '有一定反思', '但缺乏深度'] },
      C: { min: 5, max: 6, desc: '认知模糊，无法清晰表达，缺乏反思', criteria: ['说不清自己的优缺点', '没有具体例子', '缺乏自我反思', '回答很表面'] },
      D: { min: 1, max: 4, desc: '缺乏自我认知，无法回答相关问题，没有反思能力', criteria: ['完全说不清自己', '没有任何反思', '回答空洞', '明显不了解自己'] },
    },
  },
  {
    id: 'motivation',
    name: '动机匹配',
    weight: 0.10,
    description: '动机明确，与学校高度匹配',
    relatedQuestions: [2, 10],
    levels: {
      A: { min: 9, max: 10, desc: '动机明确且合理，与学校高度匹配，有具体理由', criteria: ['能说清为什么选这所学校', '理由具体且真实', '了解学校的特色项目', '表现出"非你不可"的感觉'] },
      B: { min: 7, max: 8, desc: '动机清晰，但匹配度一般，理由不够具体', criteria: ['有基本的动机', '但理由不够具体', '了解一些学校信息', '但匹配度不够强'] },
      C: { min: 5, max: 6, desc: '动机模糊，匹配度低，理由泛泛', criteria: ['说不清为什么选这所学校', '理由很泛泛', '对学校了解不多', '感觉是"随便选的"'] },
      D: { min: 1, max: 4, desc: '无明确动机，无法说明选择原因，对学校完全不了解', criteria: ['完全说不清动机', '对学校一无所知', '明显是父母选的', '完全不匹配'] },
    },
  },
] as const;

/**
 * 综合等级划分
 */
export const SCORE_GRADES = [
  { grade: 'A', min: 9.0, max: 10.0, label: '优秀', recommendation: '强烈推荐', admission: '优先录取', color: '#166534' },
  { grade: 'B', min: 7.5, max: 8.9, label: '良好', recommendation: '推荐', admission: '可以录取', color: '#1a3a2a' },
  { grade: 'C', min: 6.0, max: 7.4, label: '一般', recommendation: '需改进', admission: '候补/拒绝', color: '#b45309' },
  { grade: 'D', min: 1.0, max: 5.9, label: '较差', recommendation: '不推荐', admission: '拒绝', color: '#991b1b' },
] as const;

/**
 * 维度标签映射（用于雷达图和表格）
 */
export const DIMENSION_LABELS: Record<string, string> = {
  logic: '逻辑表达',
  depth: '专业深度',
  resilience: '抗压能力',
  communication: '沟通亲和力',
  'self-awareness': '自我认知',
  motivation: '动机匹配',
};

/**
 * 面试记录类型
 */
export interface InterviewRecord {
  id: string;
  interviewType: string;
  messages: { role: string; content: string }[];
  startTime: number;
  duration: number;
}

/**
 * 评分报告类型
 */
export interface ScoreReport {
  scores: Record<string, { score: number; comment: string }>;
  totalScore: number;
  grade: string;
  summary: string;
  strengths: string[];
  improvements: string[];
}