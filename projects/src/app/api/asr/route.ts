import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/asr
 * 用途：语音识别接口。当前仅接收音频并返回未配置状态，前端会使用浏览器语音识别兜底。
 * 输入：multipart/form-data，字段 audio 为音频 File。
 * 返回：JSON，未配置服务端 ASR 时返回 { success: false, text: '' } 和音频调试信息。
 */

const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

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

    if (audioFile.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Audio file is too large',
          message: '录音文件超过 25MB，请缩短单次回答时长后重试',
          debug: { type: audioFile.type, size: audioFile.size },
        },
        { status: 413 }
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
      error: 'Server ASR is not configured',
      message: '服务端语音识别尚未接入，前端会优先使用浏览器实时识别结果',
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
