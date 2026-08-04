'use client';

import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/interview-config';

interface TimerDisplayProps {
  seconds: number;
  className?: string;
}

export function TimerDisplay({ seconds, className }: TimerDisplayProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 font-mono text-sm text-stone-700',
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
      </span>
      {formatTime(seconds)}
    </div>
  );
}
