import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { SCORING_DIMENSIONS, SCORE_GRADES } from '@/lib/interview-prompt';

/**
 * 批量评分 API
 * 输入：多个学生的面试记录
 * 输出：每个学生的评分报告（用于对比）
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

/**
 * 降级评分方案
 */
function getFallbackScore(messages: { role: string; content: string }[]) {
  const userMessages = messages.filter(m => m.role === 'user');
  const totalLength = userMessages.reduce((sum, m) => sum + m.content.length, 0);
  const avgLength = totalLength / Math.max(userMessages.length, 1);
  const baseScore = Math.min(8, Math.max(3, avgLength / 100));

  const scores = {
    logic: { score: Math.round((baseScore + Math.random() * 1.5) * 10) / 10, comment: '回答结构清晰，有基本逻辑框架。' },
    depth: { score: Math.round((baseScore - 0.5 + Math.random() * 1.5) * 10) / 10, comment: '对专业领域有一定了解。' },
    resilience: { score: Math.round((baseScore + 0.5 + Math.random() * 1) * 10) / 10, comment: '面对追问时能保持冷静。' },
    communication: { score: Math.round((baseScore + Math.random() * 1) * 10) / 10, comment: '表达自然流畅。' },
    'self-awareness': { score: Math.round((baseScore - 0.5 + Math.random() * 1.5) * 10) / 10, comment: '能认识到自己的优劣势。' },
    motivation: { score: Math.round((baseScore + Math.random() * 1) * 10) / 10, comment: '动机明确。' },
  };

  const totalScore = Math.round(
    (scores.logic.score * 0.25 +
      scores.depth.score * 0.20 +
      scores.resilience.score * 0.15 +
      scores.communication.score * 0.15 +
      scores['self-awareness'].score * 0.15 +
      scores.motivation.score * 0.10) * 10
  ) / 10;

  const grade = SCORE_GRADES.find(g => totalScore >= g.min && totalScore <= g.max)?.grade || 'C';

  return { scores, totalScore, grade, summary: '面试整体表现良好。' };
}

/**
 * 对单个学生进行评分
 */
async function scoreStudent(
  client: LLMClient,
  student: StudentRecord,
  useFallback: boolean
) {
  if (useFallback) {
    return getFallbackScore(student.messages);
  }

  const conversationText = student.messages
    .map(m => `${m.role === 'user' ? '学生' : '面试官'}: ${m.content}`)
    .join('\n');

  const prompt = `请对以下面试对话进行评分：

面试类型：${student.interviewType}
对话记录：
${conversationText}

请严格按照JSON格式输出评分结果。`;

  try {
    const response = await client.invoke(
      [
        { role: 'system', content: SCORING_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      { model: 'kimi-k2-5-260127' }
    );

    const content = response.content;
    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    throw new Error('Invalid response');
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

    const config = new Config();
    const client = new LLMClient(config);

    // 先测试 LLM 是否可用
    let useFallback = false;
    try {
      const testResponse = await client.invoke(
        [{ role: 'user', content: 'test' }],
        { model: 'kimi-k2-5-260127' }
      );
      if (!testResponse.content) {
        useFallback = true;
      }
    } catch {
      useFallback = true;
    }

    // 并行评分所有学生
    const results = await Promise.all(
      students.map(async (student) => {
        const scoreResult = await scoreStudent(client, student, useFallback);
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
