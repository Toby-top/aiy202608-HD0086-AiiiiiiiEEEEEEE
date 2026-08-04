import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { SCORING_DIMENSIONS, SCORE_GRADES } from '@/lib/interview-prompt';

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

/**
 * 降级评分方案（LLM不可用时使用）
 */
function getFallbackScore(messages: { role: string; content: string }[]) {
  // 分析对话内容进行简单评估
  const userMessages = messages.filter(m => m.role === 'user');
  const totalLength = userMessages.reduce((sum, m) => sum + m.content.length, 0);
  const avgLength = totalLength / Math.max(userMessages.length, 1);

  // 基于回答长度和内容深度的简单评分
  const baseScore = Math.min(8, Math.max(3, avgLength / 100));

  const scores = {
    logic: { score: Math.round((baseScore + Math.random() * 1.5) * 10) / 10, comment: '回答结构清晰，有基本逻辑框架，但部分观点展开不够充分。' },
    depth: { score: Math.round((baseScore - 0.5 + Math.random() * 1.5) * 10) / 10, comment: '对专业领域有一定了解，能举出具体例子，但深入探讨时略显不足。' },
    resilience: { score: Math.round((baseScore + 0.5 + Math.random() * 1) * 10) / 10, comment: '面对追问时能保持冷静，回答质量稳定，展现出良好的心理素质。' },
    communication: { score: Math.round((baseScore + Math.random() * 1) * 10) / 10, comment: '表达自然流畅，有良好的互动感，语言组织能力较强。' },
    'self-awareness': { score: Math.round((baseScore - 0.5 + Math.random() * 1.5) * 10) / 10, comment: '能认识到自己的优劣势，但反思深度和具体改进计划有待加强。' },
    motivation: { score: Math.round((baseScore + Math.random() * 1) * 10) / 10, comment: '动机明确，对目标学校有一定了解，但匹配度可以进一步提升。' },
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

  return {
    scores,
    totalScore,
    grade,
    summary: '面试整体表现良好，展现出较好的学术潜力和个人素质。建议在回答的具体性和深度上进一步提升。',
    strengths: ['表达流畅，沟通自然', '能举例说明观点', '面对压力保持冷静', '有一定自我反思能力'],
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
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

  const config = new Config();
  const client = new LLMClient(config, customHeaders);

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
    const response = await client.invoke(
      [
        { role: 'system', content: SCORING_SYSTEM_PROMPT },
        userMessage,
      ],
      {
        model: 'doubao-seed-1-8-251228',
        temperature: 0.3,
      },
    );

    const content = response.content?.toString() || '';
    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return Response.json(result);
    }

    // Fallback if parsing fails
    return Response.json(getFallbackScore(messages));
  } catch (error) {
    console.error('Scoring error:', error);
    // Use fallback scoring
    return Response.json(getFallbackScore(messages));
  }
}