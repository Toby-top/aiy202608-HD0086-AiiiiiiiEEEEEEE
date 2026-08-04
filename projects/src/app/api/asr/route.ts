import { NextRequest, NextResponse } from 'next/server';
import { ASRClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const config = new Config();
  const client = new ASRClient(config, customHeaders);

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert audio to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const result = await client.recognize({
      uid: `user_${Date.now()}`,
      base64Data,
    });

    return NextResponse.json({
      text: result.text,
      duration: result.duration,
    });
  } catch (error) {
    console.error('ASR error:', error);
    // Return graceful fallback - ASR is optional, user can type instead
    return NextResponse.json({
      text: '',
      duration: 0,
      message: 'ASR service temporarily unavailable, please use text input',
    });
  }
}
