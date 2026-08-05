import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/asr
 * 用途：语音识别接口。Cloudflare 部署中默认接收音频并返回未配置状态，前端会使用浏览器语音识别兜底。
 * 输入：multipart/form-data，字段 audio 为音频 File。
 * 返回：JSON，未配置服务端 ASR 时返回 { success: false, text: '' } 和音频调试信息。
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (audioFile.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Audio file is empty',
          debug: { type: audioFile.type, size: audioFile.size },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: false,
      text: '',
      duration: 0,
      data: {
        text: '',
        duration: 0,
      },
      error: 'ASR service is not configured',
      message: 'ASR service is not configured; browser speech recognition fallback may be used',
      debug: {
        type: audioFile.type,
        size: audioFile.size,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      text: '',
      duration: 0,
      data: {
        text: '',
        duration: 0,
      },
      error: message || 'ASR service temporarily unavailable',
      message: 'ASR service temporarily unavailable, please use browser speech recognition',
    });
  }
}
