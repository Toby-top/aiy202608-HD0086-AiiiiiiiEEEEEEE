import { NextRequest, NextResponse } from 'next/server';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

  if (!text) {
    return NextResponse.json(
      { error: 'No text provided' },
      { status: 400 }
    );
  }

  const config = new Config();
  const client = new TTSClient(config, customHeaders);

  try {
    const response = await client.synthesize({
      uid: `user_${Date.now()}`,
      text,
      speaker: 'zh_female_vv_uranus_bigtts', // Vivi - Chinese & English bilingual
      audioFormat: 'mp3',
      sampleRate: 24000,
    });

    return NextResponse.json({
      audioUri: response.audioUri,
      audioSize: response.audioSize,
    });
  } catch (error) {
    console.error('TTS error:', error);
    // Return a graceful fallback - TTS is optional, frontend can work without it
    return NextResponse.json({
      audioUri: null,
      audioSize: 0,
      message: 'TTS service temporarily unavailable',
    });
  }
}
