'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquarePlus,
  BookOpen,
  Grid3X3,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
  User,
  Clock,
  Award,
} from 'lucide-react';
import type { InterviewType } from '@/types/interview';

interface SidebarProps {
  interviewType: string;
  messageCount: number;
  duration: number;
  onNewChat: () => void;
}

interface InterviewHistoryItem {
  id: string;
  interviewType: InterviewType;
  title: string;
  duration: number;
  createdAt: number;
}

export function Sidebar({ interviewType, messageCount, duration, onNewChat }: SidebarProps) {
  const router = useRouter();
  const [expandedFolder, setExpandedFolder] = useState(true);
  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}分${s}秒`;
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('interview-history');
      setHistory(raw ? JSON.parse(raw) : []);
    } catch {
      setHistory([]);
    }
  }, []);

  return (
    <aside className="flex h-full w-72 flex-col border-r border-stone-200/60 bg-stone-50/80">
      {/* Logo & Title */}
      <div className="flex items-center gap-2.5 border-b border-stone-200/60 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 text-white">
          <MessageSquarePlus className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-stone-900">AI 面试辅导</h1>
          <p className="text-[10px] text-stone-400">International School Interview</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {/* 新对话 */}
        <button
          onClick={onNewChat}
          className="mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
        >
          <MessageSquarePlus className="h-4 w-4 text-teal-600" />
          新对话
        </button>

        {/* 知识库 */}
        <button
          onClick={() => router.push('/knowledge')}
          className="mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-stone-600 transition-colors hover:bg-stone-100"
        >
          <BookOpen className="h-4 w-4 text-stone-400" />
          知识库
        </button>

        {/* 题库广场 */}
        <button
          onClick={() => router.push('/question-bank')}
          className="mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-stone-600 transition-colors hover:bg-stone-100"
        >
          <Grid3X3 className="h-4 w-4 text-stone-400" />
          题库广场
        </button>

        {/* Divider */}
        <div className="my-3 border-t border-stone-200/60" />

        {/* 面试档案 */}
        <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-stone-400">
          面试档案
        </p>

        {/* 当前面试文件夹 */}
        <div className="mb-1">
          <button
            onClick={() => setExpandedFolder(!expandedFolder)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
          >
            {expandedFolder ? (
              <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
            )}
            <FolderOpen className="h-4 w-4 text-amber-500" />
            <span className="truncate">
              {interviewType === 'common-app' && 'Common App 面试'}
              {interviewType === 'alumni' && '校友面试'}
              {interviewType === 'initialview' && 'Initialview 面试'}
              {!interviewType && '未命名面试'}
            </span>
          </button>

          {expandedFolder && interviewType && (
            <div className="ml-5 mt-1 space-y-0.5 border-l border-stone-200 pl-3">
              {/* 当前对话 */}
              <div className="flex items-center gap-2 rounded-md bg-teal-50 px-2.5 py-2 text-sm text-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                <span className="truncate">进行中 · {messageCount} 条消息</span>
              </div>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-stone-400">
              历史报告
            </p>
            <div className="space-y-0.5">
              {history.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    router.push(
                      `/report/${item.id}?type=${item.interviewType}&duration=${item.duration}`
                    )
                  }
                  className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors hover:bg-stone-100"
                >
                  <span className="truncate text-sm text-stone-700">{item.title}</span>
                  <span className="text-[11px] text-stone-400">
                    {formatDuration(item.duration)} · {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Current Session Stats */}
      {messageCount > 0 && (
        <div className="border-t border-stone-200/60 px-4 py-3">
          <div className="flex items-center gap-4 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDuration(duration)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" />
              <span>{messageCount} 轮对话</span>
            </div>
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className="border-t border-stone-200/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-amber-400 text-white">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700">用户 4432</p>
              <p className="text-[10px] text-stone-400">5 分钟 · 76 积分</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600">
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.push('/')}
              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
