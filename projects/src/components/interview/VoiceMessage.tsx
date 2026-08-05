'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceMessageProps {
  /** 音频 URL（学生录音） */
  audioUrl?: string;
  /** 音频时长（秒） */
  duration: number;
  /** 消息角色 */
  role: 'interviewer' | 'student';
  /** 文字内容（面试官的文本，用于 TTS 和转文字显示） */
  textContent?: string;
  /** 录音波形数据（可选） */
  waveform?: number[];
  /** 样式变体：default 或 glass（Initialview 玻璃质感） */
  variant?: 'default' | 'glass';
  /** 是否在挂载后自动播放 */
  autoPlay?: boolean;
}

/** 生成静态波形条 */
function generateWaveformBars(count: number, seed: number): number[] {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    // 使用 seed 和 index 生成伪随机高度
    const value = Math.abs(Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453) % 1;
    bars.push(0.2 + value * 0.8);
  }
  return bars;
}

export function VoiceMessage({
  audioUrl,
  duration,
  role,
  textContent,
  waveform,
  variant = 'default',
  autoPlay = false,
}: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(role === 'student');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const isInterviewer = role === 'interviewer';
  const bars = waveform || generateWaveformBars(30, duration * 100 + (isInterviewer ? 7 : 13));
  const barCount = bars.length;

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 播放面试官语音（使用 SpeechSynthesis）
  const playSpeech = useCallback(() => {
    if (!textContent || !('speechSynthesis' in window)) return;

    // 停止之前的语音
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textContent);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    setIsPlaying(true);
    startTimeRef.current = Date.now();

    const totalDuration = Math.max(duration, textContent.length * 0.08);

    const updateProgress = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setProgress(Math.min(elapsed / totalDuration, 1));
      if (elapsed < totalDuration) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };
    animFrameRef.current = requestAnimationFrame(updateProgress);

    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(0);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    window.speechSynthesis.speak(utterance);
  }, [textContent, duration]);

  // 播放学生录音或已合成的面试官音频
  const playAudio = useCallback(() => {
    if (!audioUrl) return;

    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.currentTime = 0;
      setIsPlaying(true);
      startTimeRef.current = Date.now();

      const updateProgress = () => {
        if (!audioRef.current) return;
        const elapsed = audioRef.current.currentTime;
        const safeDuration = duration || audioRef.current.duration || 1;
        setProgress(elapsed / safeDuration);
        if (elapsed < safeDuration) {
          animFrameRef.current = requestAnimationFrame(updateProgress);
        } else {
          setIsPlaying(false);
          setProgress(0);
        }
      };
      animFrameRef.current = requestAnimationFrame(updateProgress);

      void audioRef.current.play().catch(() => {
        setIsPlaying(false);
        setProgress(0);
        if (isInterviewer) {
          playSpeech();
        }
      });
    }
  }, [audioUrl, duration, isInterviewer, playSpeech]);

  // 切换播放/暂停
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      // 停止播放
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      setIsPlaying(false);
      setProgress(0);
    } else {
      // 开始播放
      if (audioUrl) {
        playAudio();
      } else if (isInterviewer) {
        playSpeech();
      } else {
        playAudio();
      }
    }
  }, [audioUrl, isPlaying, isInterviewer, playAudio, playSpeech]);

  useEffect(() => {
    if (role === 'student' && textContent) {
      setShowTranscript(true);
    }
  }, [role, textContent]);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = window.setTimeout(() => {
      if (audioUrl) {
        playAudio();
      } else if (isInterviewer) {
        playSpeech();
      }
    }, 100);

    return () => window.clearTimeout(timer);
  }, [audioUrl, autoPlay, isInterviewer, playAudio, playSpeech]);

  // 右键菜单处理（所有语音条都支持转文字）
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!textContent) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [textContent]);

  // 点击其他地方关闭菜单
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // 清理
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 计算当前播放到的 bar 位置
  const activeBarIndex = Math.floor(progress * barCount);

  return (
    <div
      className={cn(
        'flex w-full animate-[slide-up_0.3s_ease-out] gap-2',
        isInterviewer ? 'justify-start' : 'justify-end'
      )}
    >
      {/* 面试官头像 */}
      {isInterviewer && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-medium text-teal-700">
          AI
        </div>
      )}

      <div className="max-w-[80%]">
        {/* 语音条 */}
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-2xl px-3 py-2.5',
            variant === 'glass'
              ? isInterviewer
                ? 'rounded-tl-md bg-white/40 backdrop-blur-sm border border-white/50'
                : 'rounded-tr-md bg-white/40 backdrop-blur-sm border border-white/50'
              : isInterviewer
                ? 'rounded-tl-md bg-teal-50'
                : 'rounded-tr-md bg-amber-50'
          )}
          onContextMenu={handleContextMenu}
        >
          {/* 播放/暂停按钮 */}
          <button
            onClick={togglePlay}
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
              isInterviewer
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            )}
          >
            {isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3 ml-0.5" />
            )}
          </button>

          {/* 波形条 */}
          <div className="flex items-center gap-[2px] h-6">
            {bars.map((height, i) => (
              <div
                key={i}
                className={cn(
                  'w-[2px] rounded-full transition-colors duration-150',
                  i <= activeBarIndex && isPlaying
                    ? isInterviewer ? 'bg-teal-600' : 'bg-amber-500'
                    : isInterviewer ? 'bg-teal-300' : 'bg-amber-300'
                )}
                style={{ height: `${height * 100}%` }}
              />
            ))}
          </div>

          {/* 时长 */}
          <span className={cn(
            'text-xs font-mono shrink-0',
            variant === 'glass'
              ? 'text-stone-700'
              : isInterviewer ? 'text-teal-600' : 'text-amber-600'
          )}>
            {formatTime(duration)}
          </span>

          {/* 语音图标 */}
          <Volume2 className={cn(
            'h-3.5 w-3.5 shrink-0',
            variant === 'glass'
              ? 'text-stone-500'
              : isInterviewer ? 'text-teal-400' : 'text-amber-400'
          )} />
        </div>

        {/* 隐藏的 audio 元素 */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            preload="auto"
            onEnded={() => {
              setIsPlaying(false);
              setProgress(0);
            }}
            className="hidden"
          />
        )}

        {/* 进度条 */}
        {isPlaying && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-stone-200/60">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-150',
                isInterviewer ? 'bg-teal-600' : 'bg-amber-500'
              )}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}

        {/* 转文字内容 */}
        {showTranscript && textContent && (
          <div className={cn(
            'mt-2 rounded-xl px-3 py-2 text-sm leading-relaxed animate-[slide-up_0.2s_ease-out]',
            isInterviewer ? 'bg-teal-50/50 text-stone-700' : 'bg-amber-50/50 text-stone-700'
          )}>
            <p>{textContent}</p>
          </div>
        )}

        {/* 右键菜单 */}
        {contextMenu && (
          <div
            className="fixed z-50 min-w-[120px] rounded-lg border border-stone-200 bg-white py-1 shadow-lg animate-[slide-up_0.15s_ease-out]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
              onClick={() => {
                setShowTranscript(!showTranscript);
                setContextMenu(null);
              }}
            >
              <Volume2 className="h-3.5 w-3.5 text-teal-600" />
              {showTranscript ? '隐藏文字' : '转文字'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
