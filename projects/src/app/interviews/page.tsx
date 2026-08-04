/**
 * 面试类型页：展示三种模拟面试类型，供学生进入对应练习流程。
 */

import Link from 'next/link';
import { INTERVIEW_TYPES } from '@/lib/interview-config';
import { InterviewCard } from '@/components/interview/InterviewCard';
import { GraduationCap, ArrowLeft } from 'lucide-react';

export default function InterviewsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回首页</span>
          </Link>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-teal-700" />
            <span className="font-semibold text-stone-900">AI 面试辅导</span>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* 标题区 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-3">
            选择面试类型
          </h1>
          <p className="text-stone-500 max-w-lg mx-auto">
            根据你的目标学校要求，选择对应的面试类型进行模拟练习
          </p>
        </div>

        {/* 面试类型卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INTERVIEW_TYPES.map((config) => (
            <InterviewCard key={config.type} config={config} />
          ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-12 text-center">
          <p className="text-sm text-stone-400">
            每次面试约 10-15 分钟，建议安静环境下进行
          </p>
        </div>
      </main>
    </div>
  );
}
