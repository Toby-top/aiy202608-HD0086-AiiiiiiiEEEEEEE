import { NextRequest } from 'next/server';
import { createChatCompletion, extractJsonObject } from '@/lib/ai-provider';
import { SCORING_DIMENSIONS, SCORE_GRADES } from '@/lib/interview-prompt';

/**
 * POST /api/score
 * 用途：单学生面试评分接口，根据完整面试记录生成 6 维度评分与改进建议。
 * 输入：JSON body，包含 messages: { role: string; content: string }[] 和 interviewType: string。
 * 返回：JSON，包含 scores、totalScore、grade、summary、strengths、improvements。
 */

/**
 * 评分系统提示词
 */
const SCORING_SYSTEM_PROMPT = `你是一位经验丰富的国际高中升学面试评分专家。你的任务是根据面试对话记录，对学生的表现进行多维度评分。

## 评分维度（6个维度，每个1-10分）

${SCORING_DIMENSIONS.map(dim => `
### ${dim.name}（权重${(dim.weight * 100).toFixed(0)}%）
${dim.description}

A档（9-10分）：${dim.levels.A.desc}
B档（7-8分）：${dim.levels.B.desc}
C档（5-6分）：${dim.levels.C.desc}
D档（1-4分）：${dim.levels.D.desc}
`).join('\n')}

## 综合等级划分
- A级（9.0-10.0）：优秀，强烈推荐，优先录取
- B级（7.5-8.9）：良好，推荐，可以录取
- C级（6.0-7.4）：一般，需改进，候补/拒绝
- D级（1.0-5.9）：较差，不推荐，拒绝

## 评分规则
1. 每个维度独立评分，满分10分
2. 综合得分 = 各维度得分 × 权重的加权和
3. 根据综合得分确定等级
4. 每个评分必须给出具体的评语，说明得分理由
5. 最后给出3-5条具体的提升建议
6. 如果学生没有实质性回答、回答为空、只有“未检测到有效语音/语音识别失败”等占位内容，所有维度必须评为1分，综合等级为D
7. 不能因为面试官问题多、对话时长长或系统占位文本而提高学生评分，只根据学生的有效回答质量评分

## 输出格式
你必须严格按照以下JSON格式输出（不要包含任何其他内容）：

{
  "scores": {
    "logic": { "score": 8.5, "comment": "..." },
    "depth": { "score": 7.0, "comment": "..." },
    "resilience": { "score": 8.0, "comment": "..." },
    "communication": { "score": 7.5, "comment": "..." },
    "self-awareness": { "score": 6.5, "comment": "..." },
    "motivation": { "score": 8.0, "comment": "..." }
  },
  "totalScore": 7.7,
  "grade": "B",
  "summary": "整体评价...",
  "strengths": ["优点1", "优点2", "优点3"],
  "improvements": ["建议1", "建议2", "建议3", "建议4", "建议5"]
}`;

type ScoreKey = 'logic' | 'depth' | 'resilience' | 'communication' | 'self-awareness' | 'motivation';
type ScoreMap = Record<ScoreKey, { score: number; comment: string }>;
type ScoreResult = {
  scores?: Partial<Record<ScoreKey, { score?: number; comment?: string }>>;
  totalScore?: number;
  grade?: string;
  summary?: string;
  strengths?: string[];
  improvements?: string[];
};

const SCORE_WEIGHTS: Record<ScoreKey, number> = {
  logic: 0.25,
  depth: 0.20,
  resilience: 0.15,
  communication: 0.15,
  'self-awareness': 0.15,
  motivation: 0.10,
};

const EMPTY_ANSWER_PATTERNS = [
  /未检测到有效语音/,
  /语音识别暂不可用/,
  /could not be transcribed/i,
  /^\[?语音消息\]?$/,
  /^面试已结束$/,
];

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function clampScore(value: number) {
  return round1(Math.min(10, Math.max(1, value)));
}

function getStudentAnswerStats(messages: { role: string; content: string }[]) {
  const userMessages = messages.filter((m) => m.role === 'user' || m.role === 'student');
  const substantiveAnswers = userMessages
    .map((m) => m.content.trim())
    .filter((content) => content && !EMPTY_ANSWER_PATTERNS.some((pattern) => pattern.test(content)));

  const signalLength = substantiveAnswers.reduce((sum, content) => {
    const latinWords = content.match(/[A-Za-z0-9']+/g)?.length ?? 0;
    const cjkChars = content.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
    return sum + latinWords + cjkChars;
  }, 0);

  return {
    answerCount: userMessages.length,
    substantiveCount: substantiveAnswers.length,
    signalLength,
    avgSignalLength: signalLength / Math.max(substantiveAnswers.length, 1),
  };
}

function buildNoAnswerScore() {
  const scores: ScoreMap = {
    logic: { score: 1, comment: '未检测到有效回答，无法评估逻辑结构。' },
    depth: { score: 1, comment: '未检测到有效回答，缺少内容深度依据。' },
    resilience: { score: 1, comment: '未检测到有效回答，无法体现追问应对能力。' },
    communication: { score: 1, comment: '未检测到有效语音或文字表达。' },
    'self-awareness': { score: 1, comment: '未检测到有效回答，无法体现自我认知。' },
    motivation: { score: 1, comment: '未检测到有效回答，无法判断申请动机。' },
  };

  return {
    scores,
    totalScore: 1,
    grade: 'D',
    summary: '本次面试未检测到学生的实质性回答，评分仅反映有效回答缺失的情况。',
    strengths: [],
    improvements: [
      '确保麦克风可用，并在录音时完整回答问题',
      '每个问题至少给出一个具体经历或例子',
      '回答结束前简单总结自己的观点',
    ],
  };
}

function calculateTotalScore(scores: ScoreMap) {
  return round1(
    Object.entries(SCORE_WEIGHTS).reduce(
      (sum, [key, weight]) => sum + scores[key as ScoreKey].score * weight,
      0
    )
  );
}

function isScoreResult(result: unknown): result is ScoreResult {
  return typeof result === 'object' && result !== null;
}

function normalizeScoreResult(result: unknown, messages: { role: string; content: string }[]) {
  const stats = getStudentAnswerStats(messages);
  if (stats.substantiveCount === 0 || stats.signalLength < 8) {
    return buildNoAnswerScore();
  }

  if (!isScoreResult(result)) return getFallbackScore(messages);

  const scores = result.scores as ScoreMap | undefined;
  if (!scores) return getFallbackScore(messages);

  (Object.keys(SCORE_WEIGHTS) as ScoreKey[]).forEach((key) => {
    scores[key] = {
      score: clampScore(Number(scores[key]?.score ?? 1)),
      comment: String(scores[key]?.comment ?? '缺少该维度的具体评语。'),
    };
  });

  const totalScore = calculateTotalScore(scores);
  return {
    ...result,
    scores,
    totalScore,
    grade: SCORE_GRADES.find(g => totalScore >= g.min && totalScore <= g.max)?.grade || 'D',
  };
}

/**
 * 降级评分方案（LLM不可用时使用）
 */
function getFallbackScore(messages: { role: string; content: string }[]) {
  const stats = getStudentAnswerStats(messages);

  if (stats.substantiveCount === 0 || stats.signalLength < 8) {
    return buildNoAnswerScore();
  }

  const shortInterviewPenalty = stats.substantiveCount < 2 ? 1 : 0;
  const baseScore = Math.min(8.2, Math.max(3, 3 + stats.avgSignalLength / 45 - shortInterviewPenalty));

  const scores: ScoreMap = {
    logic: { score: clampScore(baseScore + 0.2), comment: '回答有基本结构，但仍需要更清晰的论点递进和总结。' },
    depth: { score: clampScore(baseScore - 0.4), comment: '能提供部分信息，但具体经历、细节和反思深度仍不足。' },
    resilience: { score: clampScore(baseScore), comment: '能够完成回答，但面对追问的稳定性还需要更多有效轮次验证。' },
    communication: { score: clampScore(baseScore + 0.1), comment: '表达基本可理解，但流畅度和重点呈现仍有提升空间。' },
    'self-awareness': { score: clampScore(baseScore - 0.3), comment: '有一定自我表达，但对成长、选择和改进计划的反思还不够具体。' },
    motivation: { score: clampScore(baseScore - 0.1), comment: '能表达基本动机，但与目标学校或项目的匹配度需要更充分展开。' },
  };

  const totalScore = calculateTotalScore(scores);

  const grade = SCORE_GRADES.find(g => totalScore >= g.min && totalScore <= g.max)?.grade || 'C';

  return {
    scores,
    totalScore,
    grade,
    summary: '本次评分使用降级规则生成，仅根据学生有效回答的数量和内容密度估算。建议以真实模型评分为准。',
    strengths: stats.substantiveCount >= 2 ? ['能够完成多轮回答', '表达内容具备基本可评估性'] : ['完成了至少一轮有效回答'],
    improvements: [
      '建议在回答问题时提供更多具体例子和细节',
      '加强对目标学校和专业的了解，展现更明确的动机',
      '提升回答的深度，尝试从多角度思考问题',
      '在自我认知方面，可以更深入地反思自己的成长',
      '课外活动的描述可以更突出个人贡献和影响力',
    ],
  };
}

export async function POST(request: NextRequest) {
  const { messages, interviewType } = await request.json();

  // Build the message array
  const conversationText = messages
    .map((m: { role: string; content: string }) =>
      `${m.role === 'assistant' ? '面试官' : '学生'}: ${m.content}`
    )
    .join('\n\n');

  const userMessage = {
    role: 'user' as const,
    content: `请根据以下面试对话记录进行评分：\n\n面试类型：${interviewType}\n\n对话记录：\n${conversationText}`,
  };

  try {
    let content = '';

    if (process.env.DEEPSEEK_API_KEY) {
      content = await createChatCompletion({
        messages: [
          { role: 'system', content: SCORING_SYSTEM_PROMPT },
          userMessage,
        ],
        temperature: 0.2,
        responseFormat: 'json_object',
      });
    }

    if (!content) {
      return Response.json(getFallbackScore(messages));
    }

    const result = extractJsonObject(content);
    return Response.json(normalizeScoreResult(result, messages));
  } catch (error) {
    console.error('Scoring error:', error);
    return Response.json(getFallbackScore(messages));
  }
}
