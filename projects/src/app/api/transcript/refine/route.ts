import { NextRequest, NextResponse } from 'next/server';
import { createChatCompletion, extractJsonObject, isDeepSeekConfigured } from '@/lib/ai-provider';

interface RefineTranscriptBody {
  text?: string;
  language?: 'en' | 'zh';
  interviewType?: string;
}

interface RefinedTranscript {
  text?: string;
}

function normalizeRefinedText(value: unknown) {
  if (!value || typeof value !== 'object') return '';
  const candidate = (value as RefinedTranscript).text;
  return typeof candidate === 'string' ? candidate.trim() : '';
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as RefineTranscriptBody;
  const rawText = body.text?.trim() || '';

  if (!rawText) {
    return NextResponse.json(
      { success: false, text: '', error: 'Missing transcript text' },
      { status: 400 }
    );
  }

  if (!isDeepSeekConfigured()) {
    return NextResponse.json({
      success: true,
      text: rawText,
      refined: false,
      message: 'DeepSeek is not configured; using browser transcript',
    });
  }

  try {
    const languageName = body.language === 'zh' ? 'Mandarin Chinese' : 'English';
    const content = await createChatCompletion({
      temperature: 0.1,
      responseFormat: 'json_object',
      messages: [
        {
          role: 'system',
          content:
            'You clean up browser speech-recognition transcripts for a mock admissions interview. Fix obvious recognition mistakes, punctuation, capitalization, and spacing. Preserve the student meaning exactly. Do not add new facts, rewrite style heavily, summarize, translate, or answer the interview question. Return only JSON with a string field named text.',
        },
        {
          role: 'user',
          content: [
            `Interview type: ${body.interviewType || 'unknown'}`,
            `Expected language: ${languageName}`,
            'Browser transcript:',
            rawText,
          ].join('\n'),
        },
      ],
    });

    const refinedText = normalizeRefinedText(extractJsonObject(content));
    return NextResponse.json({
      success: true,
      text: refinedText || rawText,
      refined: Boolean(refinedText),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Transcript refine error:', message);
    return NextResponse.json({
      success: true,
      text: rawText,
      refined: false,
      message: 'Transcript refinement failed; using browser transcript',
    });
  }
}
