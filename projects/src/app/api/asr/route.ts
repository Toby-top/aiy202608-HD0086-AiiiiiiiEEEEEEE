import { NextRequest, NextResponse } from 'next/server';
import { ASRClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * POST /api/asr
 * 用途：语音识别接口，将前端录制的音频转写为文本，作为面试回答输入。
 * 输入：multipart/form-data，字段 audio 为音频 File。
 * 返回：JSON，成功时兼容 { text, duration } 与 { success, data: { text, duration } }。
 */

export async function POST(request: NextRequest) {
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const config = new Config();
  const client = new ASRClient(config, customHeaders);

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert audio to base64
    const arrayBuffer = await audioFile.arrayBuffer();

    if (arrayBuffer.byteLength === 0) {
      return NextResponse.json(
        { success: false, error: 'Audio file is empty' },
        { status: 400 }
      );
    }

    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const result = await client.recognize({
      uid: `user_${Date.now()}`,
      base64Data,
    });

    return NextResponse.json({
      success: true,
      text: result.text,
      duration: result.duration,
      data: {
        text: result.text,
        duration: result.duration,
      },
    });
  } catch (error) {
    console.error('ASR error:', error);
    // Return graceful fallback - ASR is optional, user can type instead
    return NextResponse.json({
      success: true,
      text: '',
      duration: 0,
      data: {
        text: '',
        duration: 0,
      },
      message: 'ASR service temporarily unavailable, please use text input',
    });
  }
}
