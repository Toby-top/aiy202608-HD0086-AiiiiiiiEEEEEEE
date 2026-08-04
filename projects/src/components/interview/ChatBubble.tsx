'use client';

import type { ChatMessage } from '@/types/interview';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isInterviewer = message.role === 'interviewer';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">
          {message.content}
        </span>
      </div>
    );
  }

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

      {/* 消息气泡 */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isInterviewer
            ? 'rounded-tl-md bg-teal-50 text-stone-800'
            : 'rounded-tr-md bg-amber-50 text-stone-800'
        )}
      >
        <p>{message.content}</p>
        <span
          className={cn(
            'mt-1 block text-[10px]',
            isInterviewer ? 'text-teal-600/60' : 'text-amber-600/60'
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* 学生头像 */}
      {!isInterviewer && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-medium text-amber-700">
          Me
        </div>
      )}
    </div>
  );
}
