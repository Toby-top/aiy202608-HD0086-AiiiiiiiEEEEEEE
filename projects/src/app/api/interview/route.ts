import { NextRequest } from 'next/server';
import { createChatCompletion, isDeepSeekConfigured } from '@/lib/ai-provider';
import { INTERVIEWER_SYSTEM_PROMPT } from '@/lib/interview-prompt';

/**
 * POST /api/interview
 * 用途：AI 面试官对话接口，根据历史消息与系统提示词生成下一轮追问。
 * 输入：新版前端传入 { interviewType, message, history }；旧版前端传入 { messages }。
 * 返回：新版前端返回 { success, data: { reply, messageId, uiCmd } }；
 *      旧版前端返回 text/event-stream，逐段发送 { content }，结束为 data: [DONE]。
 */

type InterviewStage = 'ice_breaking' | 'academics' | 'critical_thinking' | 'wrap_up';

interface UICmdResponse {
  action: 'ask' | 'follow_up' | 'end';
  speaker_name: string;
  speech_text: string;
  subtitle_text: string;
  chat_bubble: string;
  mic_status: 'on' | 'off';
  camera_status: 'on' | 'off';
  current_stage: InterviewStage;
  score_hidden: {
    fluency: number;
    logic: number;
    confidence: number;
  };
}

interface ClientMessage {
  role: string;
  content: string;
}

function getStage(messageCount: number): InterviewStage {
  if (messageCount >= 8) return 'wrap_up';
  if (messageCount >= 5) return 'critical_thinking';
  if (messageCount >= 2) return 'academics';
  return 'ice_breaking';
}

function getHiddenScore(message: string) {
  const wordCount = message.trim().split(/\s+/).filter(Boolean).length;
  const fluency = Math.min(5, Math.max(1, Math.ceil(wordCount / 8)));

  return {
    fluency,
    logic: Math.min(5, Math.max(3, Math.ceil(wordCount / 12))),
    confidence: Math.min(5, Math.max(3, Math.ceil(wordCount / 10))),
  };
}

function buildUICmd(replyText: string, historyLength: number, userMessage: string): UICmdResponse {
  const stage = getStage(historyLength);
  const isEnd = /interview is now complete|thank you for your time|面试.*结束/i.test(replyText);

  return {
    action: isEnd ? 'end' : historyLength > 2 ? 'follow_up' : 'ask',
    speaker_name: 'Dr. Anderson',
    speech_text: replyText,
    subtitle_text: replyText,
    chat_bubble: replyText,
    mic_status: isEnd ? 'off' : 'on',
    camera_status: 'on',
    current_stage: stage,
    score_hidden: getHiddenScore(userMessage),
  };
}

function normalizeHistory(history: ClientMessage[] = []): ClientMessage[] {
  return history
    .filter((msg) => msg.content)
    .map((msg) => ({
      role: msg.role === 'student' || msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
}

async function handleJsonInterview(
  body: { interviewType?: string; message?: string; history?: ClientMessage[] }
) {
  const history = normalizeHistory(body.history);
  const userMessage = body.message?.trim();

  if (!body.interviewType || !userMessage) {
    return Response.json(
      { success: false, error: '缺少必要参数' },
      { status: 400 }
    );
  }

  const allMessages = [
    { role: 'system' as const, content: INTERVIEWER_SYSTEM_PROMPT },
    ...history.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    {
      role: 'user' as const,
      content: [
        `面试类型：${body.interviewType}`,
        `学生回答：${userMessage}`,
        '',
        '请实时回应这位学生刚才的具体回答，先用一句话承接，再问一个自然追问。不要照搬题库原句，不要连续问多个问题。',
      ].join('\n'),
    },
  ];

  if (!isDeepSeekConfigured()) {
    return Response.json(
      {
        success: false,
        error: 'DeepSeek is not configured',
        message: 'DeepSeek 未配置或仍是占位 key，请配置有效 DEEPSEEK_API_KEY 后再继续面试。',
      },
      { status: 503 }
    );
  }

  const replyText = await createChatCompletion({
    messages: allMessages,
    temperature: 0.8,
  });

  const uiCmd = buildUICmd(replyText, history.length, userMessage);

  return Response.json({
    success: true,
    data: {
      reply: `[UI_CMD]${JSON.stringify(uiCmd)}`,
      messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      uiCmd,
    },
  });
}

function handleStreamInterview(messages: ClientMessage[]) {
  // Build the message array with system prompt
  const systemMessage = {
    role: 'system' as const,
    content: INTERVIEWER_SYSTEM_PROMPT,
  };

  const allMessages = [
    systemMessage,
    ...messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
  ];

  if (!isDeepSeekConfigured()) {
    return Response.json(
      {
        success: false,
        error: 'DeepSeek is not configured',
        message: 'DeepSeek 未配置或仍是占位 key，请配置有效 DEEPSEEK_API_KEY 后再继续面试。',
      },
      { status: 503 }
    );
  }

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        const content = await createChatCompletion({
          messages: allMessages,
          temperature: 0.8,
        });

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.message) {
      return handleJsonInterview(body);
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    return handleStreamInterview(messages);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Interview API error:', message);
    return Response.json(
      {
        success: false,
        error: 'DeepSeek request failed',
        message: 'DeepSeek 实时回复失败，请检查 DEEPSEEK_API_KEY、网络或模型配置。',
      },
      { status: 502 }
    );
  }
}
