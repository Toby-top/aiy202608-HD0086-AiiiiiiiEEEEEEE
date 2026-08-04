'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { RecordingStatus } from '@/types/interview';
import { Mic, Square, Loader2 } from 'lucide-react';

interface RecordButtonProps {
  status: RecordingStatus;
  duration: number;
  onStart: () => void;
  onStop: () => void;
  analyserData?: Uint8Array | null;
}

export function RecordButton({
  status,
  duration,
  onStart,
  onStop,
  analyserData,
}: RecordButtonProps) {
  const handleClick = useCallback(() => {
    if (status === 'idle') {
      onStart();
    } else if (status === 'recording') {
      onStop();
    }
  }, [status, onStart, onStop]);

  const isRecording = status === 'recording';
  const isProcessing = status === 'processing';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 录音可视化 */}
      {isRecording && analyserData && (
        <div className="flex h-12 items-center gap-[2px]">
          {Array.from({ length: 32 }).map((_, i) => {
            const dataIndex = Math.floor((i / 32) * analyserData.length);
            const value = analyserData[dataIndex] ?? 128;
            const height = Math.max(4, ((value - 128) / 128) * 48 + 4);
            return (
              <div
                key={i}
                className="w-1 rounded-full bg-teal-500 transition-all duration-75"
                style={{ height: `${height}px` }}
              />
            );
          })}
        </div>
      )}

      {/* 录音时长 */}
      {isRecording && (
        <span className="font-mono text-sm text-teal-600">
          {Math.floor(duration / 60)
            .toString()
            .padStart(2, '0')}
          :{(duration % 60).toString().padStart(2, '0')}
        </span>
      )}

      {/* 主按钮 */}
      <button
        onClick={handleClick}
        disabled={isProcessing}
        className={cn(
          'relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200',
          'focus:outline-none focus:ring-4',
          isRecording
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-200'
            : isProcessing
              ? 'bg-stone-300 cursor-not-allowed'
              : 'bg-teal-700 hover:bg-teal-800 focus:ring-teal-200',
          isRecording && 'animate-pulse'
        )}
        aria-label={isRecording ? '停止录音' : '开始录音'}
      >
        {/* 录音时的脉冲环 */}
        {isRecording && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-20" />
            <span className="absolute -inset-2 animate-pulse rounded-full border-2 border-red-300 opacity-50" />
          </>
        )}

        {isProcessing ? (
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        ) : isRecording ? (
          <Square className="h-6 w-6 fill-white text-white" />
        ) : (
          <Mic className="h-6 w-6 text-white" />
        )}
      </button>

      {/* 提示文字 */}
      <p className="text-xs text-stone-500">
        {isProcessing
          ? '处理中...'
          : isRecording
            ? '点击停止录音'
            : '点击开始录音'}
      </p>
    </div>
  );
}
