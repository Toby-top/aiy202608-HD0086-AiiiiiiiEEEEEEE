/**
 * 忘记密码页：提供账号找回和密码重置邮件发送入口。
 */

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
