'use client';

import { useRouter } from 'next/navigation';
import type { InterviewTypeConfig } from '@/types/interview';
import { cn } from '@/lib/utils';
import { GraduationCap, Users, Video } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'graduation-cap': GraduationCap,
  users: Users,
  video: Video,
};

interface InterviewCardProps {
  config: InterviewTypeConfig;
}

export function InterviewCard({ config }: InterviewCardProps) {
  const router = useRouter();
  const Icon = iconMap[config.icon] ?? GraduationCap;

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-2xl border bg-white p-6 transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-lg',
        config.borderColor
      )}
    >
      {/* 图标 */}
      <div
        className={cn(
          'mb-4 flex h-12 w-12 items-center justify-center rounded-xl',
          config.bgColor
        )}
      >
        <Icon className={cn('h-6 w-6', config.color)} />
      </div>

      {/* 标题 */}
      <h3 className="mb-1 text-lg font-semibold tracking-tight text-stone-900">
        {config.title}
      </h3>
      <p className="mb-3 text-sm text-stone-500">{config.subtitle}</p>

      {/* 描述 */}
      <p className="mb-6 flex-1 text-sm leading-relaxed text-stone-600">
        {config.description}
      </p>

      {/* 开始按钮 */}
      <button
        onClick={() => router.push(`/interview/${config.type}`)}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition-all duration-200',
          'bg-teal-700 hover:bg-teal-800 active:scale-[0.98]',
          'focus:outline-none focus:ring-2 focus:ring-teal-700/30'
        )}
      >
        开始模拟面试
        <svg
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
