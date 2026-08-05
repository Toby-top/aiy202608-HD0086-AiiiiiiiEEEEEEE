import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/tts
 * 用途：语音合成接口。Cloudflare 部署中默认返回降级状态，前端会使用浏览器 SpeechSynthesis 播放面试官语音。
 * 输入：JSON body，包含 text: string。
 * 返回：JSON，未配置服务端 TTS 时返回 { success: false, audioUri: null }。
 */

export async function POST(request: NextRequest) {
  const { text } = await request.json();

  if (!text) {
    return NextResponse.json(
      { success: false, error: 'No text provided' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: false,
    audioUri: null,
    audioSize: 0,
    data: {
      audioUri: null,
      audioSize: 0,
    },
    message: 'Server TTS is not configured; browser speech synthesis will be used',
  });
}
