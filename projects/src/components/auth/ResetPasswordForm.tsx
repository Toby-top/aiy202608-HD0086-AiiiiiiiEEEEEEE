'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    setError('');
    if (!password || password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    setSuccess(true);

    // 2 秒后跳转到登录页
    setTimeout(() => {
      router.push('/auth/login');
    }, 2000);
  };

  if (success) {
    return (
      <div className="w-full max-w-[400px] mx-auto text-center">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-teal-600" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">
          密码重置成功
        </h1>
        <p className="text-sm text-stone-500">
          即将跳转到登录页面...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px] mx-auto">
      {/* 返回按钮 */}
      <button
        type="button"
        onClick={() => router.push('/auth/forgot-password')}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          重置密码
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          手机号 {phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')} 验证成功，请设置新密码
        </p>
      </div>

      {/* 表单 */}
      <div className="space-y-4">
        {/* 新密码 */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">新密码</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入新密码（至少 6 位）"
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

        {/* 确认新密码 */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">确认新密码</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="请再次输入新密码"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 bg-stone-50 border rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all',
                confirmPassword && confirmPassword !== password
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20'
                  : 'border-stone-200 focus:border-teal-500'
              )}
            />
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p className="mt-1 text-xs text-red-500">两次密码不一致</p>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {/* 重置按钮 */}
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-700 text-white text-sm font-medium rounded-lg hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            '确认重置'
          )}
        </button>
      </div>
    </div>
  );
}
