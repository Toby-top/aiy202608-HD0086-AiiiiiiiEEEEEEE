/**
 * 登录首页：展示 AI 面试辅导品牌场景，并提供学生登录入口。
 */

import Image from 'next/image';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { GraduationCap, Users, Mic, BadgeDollarSign } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* 移动端顶部展示区 */}
      <div className="lg:hidden relative h-64 overflow-hidden">
        <Image
          src="/hero-interview-v3.png"
          alt="国际高中面试场景"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-teal-900/70 via-teal-900/50 to-teal-900/80" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
          <Link
            href="/pricing"
            className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            <BadgeDollarSign className="h-3.5 w-3.5" />
            套餐
          </Link>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">AI 面试辅导</span>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight tracking-tight">
            模拟真实面试，自信迎接挑战
          </h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-16rem)] lg:min-h-screen">
        {/* 左侧展示区 - 桌面端 */}
        <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
          <Image
            src="/hero-interview-v3.png"
            alt="国际高中面试场景"
            fill
            sizes="(max-width: 1024px) 0vw, 50vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-l from-teal-950/90 via-teal-900/60 to-transparent" />

          <div className="relative z-10 ml-auto flex w-full max-w-xl flex-col justify-center px-10 xl:px-12">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AI 面试辅导</span>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                <BadgeDollarSign className="h-4 w-4" />
                查看套餐
              </Link>
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight mb-6">
              模拟真实面试
              <br />
              <span className="text-amber-300">自信迎接挑战</span>
            </h1>

            <p className="text-lg text-white/80 leading-relaxed mb-10">
              AI 驱动的国际高中面试模拟系统，支持 Common App、校友面试、Initialview 三种面试类型。语音对话、实时评分、面试回放，帮助你全面提升面试表现。
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Mic className="w-4 h-4 text-amber-300" />
                </div>
                <span className="text-white/90">语音对话模拟，真实面试体验</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-amber-300" />
                </div>
                <span className="text-white/90">AI 智能评分，针对性改进建议</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-amber-300" />
                </div>
                <span className="text-white/90">面试回放复盘，持续提升表现</span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧登录区 */}
        <div className="w-full lg:w-[480px] xl:w-[520px] flex items-center justify-center px-6 py-8 lg:py-12 bg-white">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
