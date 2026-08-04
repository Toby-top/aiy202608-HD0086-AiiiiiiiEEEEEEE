'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Lock, MessageSquare, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type LoginMode = 'code' | 'password';

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>('code');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = useCallback(() => {
    if (!phone || phone.length < 11) {
      setError('请输入正确的手机号');
      return;
    }
    setError('');
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [phone]);

  const handleLogin = useCallback(async () => {
    setError('');
    if (!phone || phone.length < 11) {
      setError('请输入正确的手机号');
      return;
    }
    if (mode === 'code' && !code) {
      setError('请输入验证码');
      return;
    }
    if (mode === 'password' && !password) {
      setError('请输入密码');
      return;
    }

    // 验证测试账号
    const TEST_PHONE = '11111111111';
    const TEST_PASSWORD = '123456';

    if (mode === 'password') {
      if (phone === TEST_PHONE && password === TEST_PASSWORD) {
        // 测试账号登录成功
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        setLoading(false);
        router.push('/interview');
        return;
      }
      setError('手机号或密码错误');
      return;
    }

    // 验证码模式：测试账号直接通过
    if (phone === TEST_PHONE) {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLoading(false);
      router.push('/interview');
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    router.push('/interview');
  }, [phone, code, password, mode, router]);

  return (
    <div className="w-full max-w-[380px]">
      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          欢迎回来
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          登录开始你的 AI 面试练习
        </p>
      </div>

      {/* 登录方式切换 */}
      <div className="flex gap-1 p-1 bg-stone-100 rounded-lg mb-6">
        <button
          type="button"
          onClick={() => { setMode('code'); setError(''); }}
          className={cn(
            'flex-1 py-2 text-sm font-medium rounded-md transition-all',
            mode === 'code'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          )}
        >
          验证码登录
        </button>
        <button
          type="button"
          onClick={() => { setMode('password'); setError(''); }}
          className={cn(
            'flex-1 py-2 text-sm font-medium rounded-md transition-all',
            mode === 'password'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          )}
        >
          密码登录
        </button>
      </div>

      {/* 表单 */}
      <div className="space-y-4">
        {/* 手机号 */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            手机号
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                setPhone(val);
                setError('');
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
        </div>

        {/* 验证码或密码 */}
        {mode === 'code' ? (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              验证码
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="请输入验证码"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={sendCode}
                disabled={countdown > 0}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all',
                  countdown > 0
                    ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                )}
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* 忘记密码 */}
        {mode === 'password' && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/auth/forgot-password')}
              className="text-sm text-teal-600 hover:text-teal-700 transition-colors"
            >
              忘记密码？
            </button>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {/* 登录按钮 */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-700 text-white text-sm font-medium rounded-lg hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              登录
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* 注册入口 */}
      <p className="mt-6 text-center text-sm text-stone-500">
        还没有账号？
        <button
          type="button"
          onClick={() => router.push('/auth/register')}
          className="ml-1 text-teal-600 font-medium hover:text-teal-700 transition-colors"
        >
          立即注册
        </button>
      </p>

    </div>
  );
}
