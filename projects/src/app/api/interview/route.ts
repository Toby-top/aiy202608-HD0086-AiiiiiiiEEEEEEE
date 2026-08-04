import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { INTERVIEWER_SYSTEM_PROMPT } from '@/lib/interview-prompt';

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

export async function POST(request: NextRequest) {
  const { messages } = await request.json();
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

  const config = new Config();
  const client = new LLMClient(config, customHeaders);

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
