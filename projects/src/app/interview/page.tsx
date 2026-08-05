'use client';

/**
 * 面试入口页：管理新对话、面试类型选择与正式开始前的设备检测。
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { InterviewType } from '@/types/interview';
import { getInterviewConfig, INTERVIEW_TYPES } from '@/lib/interview-config';
import { Sidebar } from '@/components/interview/Sidebar';
import { MobileSidebarDrawer } from '@/components/interview/MobileSidebarDrawer';
import { DeviceTest } from '@/components/interview/DeviceTest';
import {
  GraduationCap,
  Users,
  Video,
  ChevronRight,
  Bot,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';

const TYPE_ICONS = {
  'common-app': GraduationCap,
  alumni: Users,
  initialview: Video,
};

export default function InterviewPage() {
  const router = useRouter();
  const [showSelection, setShowSelection] = useState(false);
  const [selectedType, setSelectedType] = useState<InterviewType | null>(null);
  const [showDeviceTest, setShowDeviceTest] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectType = (type: InterviewType) => {
    setSelectedType(type);
    setShowDeviceTest(true);
    setShowSelection(false);
  };

  const handleDeviceTestComplete = () => {
    if (selectedType) {
      router.push(`/interview/${selectedType}?ready=true`);
    }
  };

  const handleDeviceTestBack = () => {
    setShowDeviceTest(false);
    setSelectedType(null);
  };

  const handleNewChat = () => {
    setShowSelection(true);
    setShowDeviceTest(false);
    setSelectedType(null);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-stone-50">
      <button
        onClick={() => setSidebarOpen((value) => !value)}
        className="fixed left-3 top-3 z-50 inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-lg transition-all hover:bg-stone-50 lg:hidden"
        aria-label={sidebarOpen ? '关闭侧边栏' : '打开侧边栏'}
      >
        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        <span>菜单</span>
      </button>

      {/* Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar
          interviewType=""
          messageCount={0}
          duration={0}
          onNewChat={handleNewChat}
        />
      </div>

      <MobileSidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <Sidebar
          interviewType=""
          messageCount={0}
          duration={0}
          onNewChat={handleNewChat}
        />
      </MobileSidebarDrawer>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Device Test Modal */}
        {showDeviceTest && selectedType && (
          <DeviceTest
            interviewTitle={getInterviewConfig(selectedType)?.title || '面试'}
            onStartInterview={handleDeviceTestComplete}
            onBack={handleDeviceTestBack}
          />
        )}

        {/* Header */}
        {!showDeviceTest && (
          <>
            <header className="border-b border-stone-200/60 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 px-4 py-3 pl-28 sm:px-6 sm:pl-32 lg:pl-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-sm">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-stone-900">AI 面试辅导</h1>
                  <p className="text-[10px] text-stone-400">
                    {showSelection ? '选择面试类型开始练习' : '欢迎回来'}
                  </p>
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {showSelection ? (
                <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
                  {/* Title */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
                      选择面试类型
                    </h2>
                    <p className="mt-2 text-sm text-stone-500">
                      根据你的目标学校要求，选择对应的面试类型进行模拟练习
                    </p>
                  </div>

                  {/* Interview Type List */}
                  <div className="space-y-2">
                    {INTERVIEW_TYPES.map((cfg) => {
                      const Icon = TYPE_ICONS[cfg.type] || GraduationCap;

                      return (
                        <button
                          key={cfg.type}
                          onClick={() => handleSelectType(cfg.type)}
                          className="group flex w-full items-center gap-4 rounded-xl border border-stone-200/80 bg-white p-4 text-left transition-all hover:border-teal-200 hover:shadow-md"
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                              cfg.type === 'common-app'
                                ? 'bg-teal-50 text-teal-600'
                                : cfg.type === 'alumni'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-stone-900 sm:text-base">
                              {cfg.title}
                            </h3>
                            <p className="mt-0.5 text-xs text-stone-400 line-clamp-1">
                              {cfg.description}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-500" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Tip */}
                  <div className="mt-6 flex items-start gap-2 rounded-lg bg-amber-50/50 p-3 text-xs text-stone-500">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <span>每次面试约 10-15 分钟，建议安静环境下进行</span>
                  </div>
                </div>
              ) : (
                /* Welcome Screen */
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <h2 className="text-lg font-semibold text-stone-900">
                      欢迎使用 AI 面试辅导
                    </h2>
                    <p className="mt-2 text-sm text-stone-500">
                      点击左侧「新对话」开始模拟面试
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
