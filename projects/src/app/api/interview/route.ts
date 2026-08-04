import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
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

/**
 * Fallback responses when LLM is unavailable
 */
const FALLBACK_RESPONSES = [
  "Hello! Welcome to your interview. I'm Dr. Anderson, and I'm delighted to meet you today. This interview is a chance for me to get to know you better beyond your application. There are no right or wrong answers - I just want to hear your story. Shall we begin with you telling me a little about yourself?",
  "That's wonderful! Thank you for sharing that. Now, I'd love to hear about your academic interests. What subject or field excites you the most, and why?",
  "Very interesting! Can you tell me more about what drew you to that subject? Have you had any opportunities to explore it outside of the classroom?",
  "That's great to hear. Now let's talk about your extracurricular activities. What's the activity you're most involved in or passionate about?",
  "Tell me more about your role in that activity. What challenges have you faced, and how did you overcome them?",
  "That shows real growth. Now, can you tell me about a time when you faced a significant challenge or failure? How did you handle it?",
  "Thank you for sharing that - it takes courage to reflect on difficult experiences. Now, I'm curious - why are you interested in attending our university? What specifically attracts you?",
  "That's thoughtful. Before we wrap up, do you have any questions for me? I'd love to hear what you're curious about.",
  "Thank you so much for your time today. It was a pleasure getting to know you. The interview is now complete. We wish you all the best in your application!",
];

function getFallbackResponse(messageCount: number): string {
  const index = Math.min(Math.floor(messageCount / 2), FALLBACK_RESPONSES.length - 1);
  return FALLBACK_RESPONSES[index];
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
  body: { interviewType?: string; message?: string; history?: ClientMessage[] },
  client: LLMClient
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
      content: `面试类型：${body.interviewType}\n学生回答：${userMessage}`,
    },
  ];

  let replyText = getFallbackResponse(history.length + 1);

  try {
    const response = await client.invoke(allMessages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.8,
    });
    replyText = response.content?.toString() || replyText;
  } catch (error) {
    console.error('JSON interview error:', error);
  }

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

function handleStreamInterview(messages: ClientMessage[], client: LLMClient) {
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

  try {
    const stream = client.stream(allMessages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.8,
      streaming: true,
    });

    const encoder = new TextEncoder();
    let hasContent = false;

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              hasContent = true;
              const text = chunk.content.toString();
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
              );
            }
          }

          // If no content was received (API error), use fallback
          if (!hasContent) {
            const fallback = getFallbackResponse(messages.length);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: fallback })}\n\n`)
            );
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          // Use fallback response on error
          const fallback = getFallbackResponse(messages.length);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: fallback })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
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
  } catch (error) {
    console.error('LLM error:', error);
    // Return fallback response
    const fallback = getFallbackResponse(messages.length);
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ content: fallback })}\n\n`)
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
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
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const config = new Config();
  const client = new LLMClient(config, customHeaders);

  if (body.message) {
    return handleJsonInterview(body, client);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  return handleStreamInterview(messages, client);
}
