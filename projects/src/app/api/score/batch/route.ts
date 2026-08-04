import { NextRequest } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { createChatCompletion, extractJsonObject } from '@/lib/ai-provider';
import { SCORING_DIMENSIONS, SCORE_GRADES } from '@/lib/interview-prompt';

/**
 * POST /api/score/batch
 * 用途：批量评分对比接口，为 2-10 个学生生成可横向比较的评分报告。
 * 输入：JSON body，包含 students: StudentRecord[]，每个学生含 id、name、messages、interviewType。
 * 返回：JSON，成功时为 { results: StudentScore[] }，失败时为 { error: string }。
 */

interface StudentRecord {
  id: string;
  name: string;
  messages: { role: string; content: string }[];
  interviewType: string;
}

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
1. 只根据学生有效回答评分，不得因为面试官问题多、对话时长长或占位文本而提高分数
2. 如果学生没有实质性回答、回答为空、只有“未检测到有效语音/语音识别失败”等占位内容，所有维度必须评为1分，综合等级为D

## 输出格式
你必须严格按照以下JSON格式输出：

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
  "summary": "整体评价..."
}`;

type ScoreKey = 'logic' | 'depth' | 'resilience' | 'communication' | 'self-awareness' | 'motivation';
type ScoreMap = Record<ScoreKey, { score: number; comment: string }>;
type ScoreResult = {
  scores?: Partial<Record<ScoreKey, { score?: number; comment?: string }>>;
  totalScore?: number;
  grade?: string;
  summary?: string;
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
    substantiveCount: substantiveAnswers.length,
    signalLength,
    avgSignalLength: signalLength / Math.max(substantiveAnswers.length, 1),
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

function buildNoAnswerScore() {
  const scores: ScoreMap = {
    logic: { score: 1, comment: '未检测到有效回答，无法评估逻辑结构。' },
    depth: { score: 1, comment: '未检测到有效回答，缺少内容深度依据。' },
    resilience: { score: 1, comment: '未检测到有效回答，无法体现追问应对能力。' },
    communication: { score: 1, comment: '未检测到有效语音或文字表达。' },
    'self-awareness': { score: 1, comment: '未检测到有效回答，无法体现自我认知。' },
    motivation: { score: 1, comment: '未检测到有效回答，无法判断申请动机。' },
  };

  return { scores, totalScore: 1, grade: 'D', summary: '未检测到学生的实质性回答。' };
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
 * 降级评分方案
 */
function getFallbackScore(messages: { role: string; content: string }[]) {
  const stats = getStudentAnswerStats(messages);
  if (stats.substantiveCount === 0 || stats.signalLength < 8) {
    return buildNoAnswerScore();
  }

  const shortInterviewPenalty = stats.substantiveCount < 2 ? 1 : 0;
  const baseScore = Math.min(8.2, Math.max(3, 3 + stats.avgSignalLength / 45 - shortInterviewPenalty));

  const scores: ScoreMap = {
    logic: { score: clampScore(baseScore + 0.2), comment: '回答有基本结构，但论点递进和总结仍可加强。' },
    depth: { score: clampScore(baseScore - 0.4), comment: '内容具备可评估性，但细节和反思深度仍不足。' },
    resilience: { score: clampScore(baseScore), comment: '能够完成回答，但追问应对需要更多轮次验证。' },
    communication: { score: clampScore(baseScore + 0.1), comment: '表达基本可理解，但重点呈现仍有提升空间。' },
    'self-awareness': { score: clampScore(baseScore - 0.3), comment: '有一定自我表达，但自我认知还不够具体。' },
    motivation: { score: clampScore(baseScore - 0.1), comment: '能表达基本动机，但匹配度需要更充分展开。' },
  };

  const totalScore = calculateTotalScore(scores);

  const grade = SCORE_GRADES.find(g => totalScore >= g.min && totalScore <= g.max)?.grade || 'C';

  return { scores, totalScore, grade, summary: '本次评分使用降级规则生成，仅根据学生有效回答估算。' };
}

/**
 * 对单个学生进行评分
 */
async function scoreStudent(
  client: LLMClient | null,
  student: StudentRecord
) {
  const conversationText = student.messages
    .map(m => `${m.role === 'user' ? '学生' : '面试官'}: ${m.content}`)
    .join('\n');

  const prompt = `请对以下面试对话进行评分：

面试类型：${student.interviewType}
对话记录：
${conversationText}

请严格按照JSON格式输出评分结果。`;

  try {
    let content = '';

    if (process.env.DEEPSEEK_API_KEY) {
      content = await createChatCompletion({
        messages: [
          { role: 'system', content: SCORING_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        responseFormat: 'json_object',
      });
    } else {
      if (!client) {
        throw new Error('Fallback LLM client is not available');
      }

      const response = await client.invoke(
        [
          { role: 'system', content: SCORING_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        { model: 'kimi-k2-5-260127', temperature: 0.3 }
      );
      content = response.content?.toString() || '';
    }

    return normalizeScoreResult(extractJsonObject(content), student.messages);
  } catch {
    return getFallbackScore(student.messages);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { students } = body as { students: StudentRecord[] };

    if (!students || !Array.isArray(students) || students.length === 0) {
      return Response.json(
        { error: '请提供至少一个学生的面试记录' },
        { status: 400 }
      );
    }

    if (students.length > 10) {
      return Response.json(
        { error: '最多支持10个学生同时对比' },
        { status: 400 }
      );
    }

    const client = process.env.DEEPSEEK_API_KEY ? null : new LLMClient(new Config());

    // 并行评分所有学生
    const results = await Promise.all(
      students.map(async (student) => {
        const scoreResult = await scoreStudent(client, student);
        return {
          id: student.id,
          name: student.name,
          ...scoreResult,
        };
      })
    );

    return Response.json({ results });
  } catch (error) {
    console.error('Batch score error:', error);
    return Response.json(
      { error: '批量评分失败，请稍后重试' },
      { status: 500 }
    );
  }
}
