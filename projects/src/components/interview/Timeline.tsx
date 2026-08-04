'use client';

import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/interview-config';
import { getAnnotationStyle } from '@/lib/mockInterview';
import type { InterviewSegment, Annotation } from '@/types/interview';
import {
  MessageSquare,
  Mic,
  Play,
  Star,
  Zap,
  AlertTriangle,
  ThumbsUp,
  Clock,
} from 'lucide-react';

interface TimelineProps {
  segments: InterviewSegment[];
  /** 当前播放时间（秒） */
  currentTime: number;
  /** 点击片段跳转回调 */
  onSegmentClick: (segment: InterviewSegment) => void;
}

/** 标注类型对应的图标 */
function AnnotationIcon({ type }: { type: string }) {
  const iconProps = { className: 'h-3 w-3' };
  switch (type) {
    case 'fast-pace':
      return <Zap {...iconProps} />;
    case 'nervous':
      return <AlertTriangle {...iconProps} />;
    case 'key-point':
      return <Star {...iconProps} />;
    case 'good-answer':
      return <ThumbsUp {...iconProps} />;
    case 'pause-long':
      return <Clock {...iconProps} />;
    case 'filler-word':
      return <MessageSquare {...iconProps} />;
    default:
      return <Star {...iconProps} />;
  }
}

/** 片段类型标签 */
function SegmentBadge({ segment }: { segment: InterviewSegment }) {
  if (segment.type === 'opening') {
    return (
      <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">
        开场
      </span>
    );
  }
  if (segment.type === 'closing') {
    return (
      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
        结束
      </span>
    );
  }
  if (segment.type === 'question') {
    return (
      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
        面试官提问{segment.questionIndex ? ` Q${segment.questionIndex}` : ''}
      </span>
    );
  }
  if (segment.type === 'answer') {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
        学生回答{segment.questionIndex ? ` Q${segment.questionIndex}` : ''}
      </span>
    );
  }
  return null;
}

/** 判断当前播放时间是否在片段范围内 */
function isActiveSegment(segment: InterviewSegment, currentTime: number): boolean {
  return currentTime >= segment.startTime && currentTime < segment.endTime;
}

/** 单个标注徽章 */
function AnnotationBadge({ annotation }: { annotation: Annotation }) {
  const style = getAnnotationStyle(annotation.type);

  return (
    <div className="group/badge relative">
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-opacity',
          style.bg,
          style.text,
          style.border
        )}
      >
        <AnnotationIcon type={annotation.type} />
        {annotation.label}
      </span>
      {/* Hover 详情 */}
      <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-56 rounded-lg border border-stone-200 bg-white p-2.5 shadow-lg group-hover/badge:block">
        <p className="text-xs leading-relaxed text-stone-600">{annotation.detail}</p>
        <p className="mt-1 font-mono text-[10px] text-stone-400">
          {formatTime(Math.floor(annotation.startTime))} -{' '}
          {formatTime(Math.floor(annotation.endTime))}
        </p>
      </div>
    </div>
  );
}

export function Timeline({ segments, currentTime, onSegmentClick }: TimelineProps) {
  return (
    <div className="relative">
      {/* 竖线 */}
      <div className="absolute left-[15px] top-0 h-full w-px bg-stone-200 sm:left-[19px]" />

      <div className="space-y-1">
        {segments.map((segment) => {
          const isActive = isActiveSegment(segment, currentTime);
          const isPast = currentTime >= segment.endTime;

          return (
            <div
              key={segment.id}
              className={cn(
                'group relative flex gap-4 rounded-lg p-2 transition-colors sm:gap-5 sm:p-3',
                isActive
                  ? 'bg-teal-50/50'
                  : 'hover:bg-stone-50'
              )}
            >
              {/* 节点圆点 */}
              <button
                onClick={() => onSegmentClick(segment)}
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all sm:h-10 sm:w-10',
                  isActive
                    ? 'border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-200'
                    : isPast
                      ? 'border-teal-300 bg-teal-50 text-teal-600'
                      : 'border-stone-300 bg-white text-stone-400 hover:border-teal-400 hover:text-teal-500'
                )}
                aria-label={`跳转到 ${formatTime(Math.floor(segment.startTime))}`}
              >
                {isActive ? (
                  <Play className="h-3 w-3 fill-white sm:h-4 sm:w-4" />
                ) : segment.role === 'interviewer' ? (
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : segment.role === 'student' ? (
                  <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-stone-400" />
                )}
              </button>

              {/* 内容区 */}
              <div className="min-w-0 flex-1 pb-2">
                {/* 头部：时间 + 标签 */}
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-stone-400">
                    {formatTime(Math.floor(segment.startTime))}
                  </span>
                  <SegmentBadge segment={segment} />
                </div>

                {/* 内容摘要 */}
                <button
                  onClick={() => onSegmentClick(segment)}
                  className="mb-2 block w-full text-left"
                >
                  <p
                    className={cn(
                      'line-clamp-2 text-sm leading-relaxed transition-colors',
                      isActive
                        ? 'font-medium text-stone-900'
                        : 'text-stone-600 group-hover:text-stone-800'
                    )}
                  >
                    {segment.content}
                  </p>
                </button>

                {/* AI 标注 */}
                {segment.annotations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {segment.annotations.map((annotation, i) => (
                      <AnnotationBadge key={i} annotation={annotation} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
