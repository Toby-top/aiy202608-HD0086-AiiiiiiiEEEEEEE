/**
 * 注册页：承载新学生账号注册表单。
 */

import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
        <RegisterForm />
      </div>
    </div>
  );
}
