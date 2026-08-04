'use client';

/**
 * 套餐页：展示免费版、专业版、企业版，并模拟订阅与扫码支付流程。
 */

import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Crown, Zap, Star } from 'lucide-react';

// 套餐类型定义
export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  excludedFeatures: string[];
  icon: ReactNode;
  popular?: boolean;
  color: string;
}

// 套餐数据
const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    period: '永久',
    description: '适合体验面试辅导',
    icon: <Star className="w-6 h-6" />,
    color: 'from-gray-400 to-gray-500',
    features: [
      '每月 3 次模拟面试',
      '基础 AI 评分报告',
      '录音回放功能',
      '社区支持',
    ],
    excludedFeatures: [
      '无限制面试次数',
      '详细分析报告',
      '优先客服支持',
      '自定义面试官',
    ],
  },
  {
    id: 'pro',
    name: '专业版',
    price: 99,
    period: '/月',
    description: '适合认真准备面试的学生',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-teal-500 to-teal-600',
    popular: true,
    features: [
      '无限制模拟面试',
      '详细 AI 分析报告',
      '录音 + 录像回放',
      '优先客服支持',
      '多种面试类型',
      '面试技巧课程',
    ],
    excludedFeatures: [
      '自定义面试官',
      '企业级 API 接入',
    ],
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: 299,
    period: '/月',
    description: '适合学校和教育机构',
    icon: <Crown className="w-6 h-6" />,
    color: 'from-amber-500 to-amber-600',
    features: [
      '专业版所有功能',
      '自定义面试官人设',
      '批量学生管理',
      '企业级 API 接入',
      '专属客户经理',
      '数据导出与分析',
      'SLA 服务保障',
    ],
    excludedFeatures: [],
  },
];

// 保存到 localStorage 的辅助函数
const saveSubscription = (planId: string) => {
  const subscription = {
    planId,
    activatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 天后过期
    status: 'active',
  };
  localStorage.setItem('user_subscription', JSON.stringify(subscription));
};

// 获取当前订阅
export const getSubscription = () => {
  if (typeof window === 'undefined') return null;
  const sub = localStorage.getItem('user_subscription');
  if (!sub) return null;
  try {
    const parsed = JSON.parse(sub);
    // 检查是否过期
    if (new Date(parsed.expiresAt) < new Date()) {
      localStorage.removeItem('user_subscription');
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export default function PricingPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'wechat'>('alipay');
  const [paymentCountdown, setPaymentCountdown] = useState('05:00');
  const qrPattern = useMemo(
    () => Array.from({ length: 64 }, (_, index) => (index * 17 + 11) % 7 < 3),
    []
  );

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      // 免费版直接激活
      saveSubscription('free');
      router.push('/interviews');
      return;
    }
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;
    
    setPaymentProcessing(true);
    
    // 模拟支付处理
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 保存订阅
    saveSubscription(selectedPlan);
    
    setPaymentProcessing(false);
    setPaymentSuccess(true);
    
    // 2 秒后自动关闭
    setTimeout(() => {
      setShowPaymentModal(false);
      setPaymentSuccess(false);
      router.push('/interviews');
    }, 2000);
  };

  // 倒计时逻辑
  useEffect(() => {
    if (!showPaymentModal || paymentSuccess) return;
    
    let seconds = 300; // 5 分钟
    const timer = setInterval(() => {
      seconds--;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      setPaymentCountdown(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      
      if (seconds <= 0) {
        clearInterval(timer);
        setShowPaymentModal(false);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [showPaymentModal, paymentSuccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-teal-50/30">
      {/* 头部 */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-stone-900 tracking-tight">
              选择适合你的套餐
            </h1>
            <p className="mt-4 text-lg text-stone-600">
              从免费版开始，随时升级到专业版或企业版
            </p>
          </div>
        </div>
      </div>

      {/* 套餐卡片 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                plan.popular ? 'border-teal-500' : 'border-stone-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
                    最受欢迎
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* 图标和名称 */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${plan.color} text-white mb-4`}>
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-bold text-stone-900">{plan.name}</h3>
                <p className="mt-2 text-stone-600">{plan.description}</p>

                {/* 价格 */}
                <div className="mt-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-stone-900">
                      ¥{plan.price}
                    </span>
                    <span className="ml-2 text-stone-600">{plan.period}</span>
                  </div>
                </div>

                {/* 功能列表 */}
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span className="ml-3 text-stone-700">{feature}</span>
                    </li>
                  ))}
                  {plan.excludedFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start opacity-50">
                      <X className="w-5 h-5 text-stone-400 mt-0.5 flex-shrink-0" />
                      <span className="ml-3 text-stone-500 line-through">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* 按钮 */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`mt-8 w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 shadow-md hover:shadow-lg'
                      : 'bg-stone-100 text-stone-900 hover:bg-stone-200'
                  }`}
                >
                  {plan.id === 'free' ? '免费开始' : '立即订阅'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 常见问题 */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-stone-900 mb-12">
            常见问题
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="font-semibold text-stone-900 mb-2">可以随时取消订阅吗？</h3>
              <p className="text-stone-600">是的，你可以随时取消订阅，取消后当前周期内仍可正常使用。</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="font-semibold text-stone-900 mb-2">支持哪些支付方式？</h3>
              <p className="text-stone-600">我们支持支付宝、微信支付、信用卡等多种支付方式。</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="font-semibold text-stone-900 mb-2">企业版可以定制吗？</h3>
              <p className="text-stone-600">企业版支持完全定制，包括面试官人设、题库、报告模板等。</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="font-semibold text-stone-900 mb-2">有学生优惠吗？</h3>
              <p className="text-stone-600">凭学生证可享受专业版 8 折优惠，联系我们获取优惠码。</p>
            </div>
          </div>
        </div>
      </div>

      {/* 支付弹窗 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            {!paymentSuccess ? (
              <>
                <h3 className="text-2xl font-bold text-stone-900 mb-2">扫码支付</h3>
                <p className="text-stone-600 mb-6">
                  订阅{' '}
                  <span className="font-semibold text-teal-600">
                    {pricingPlans.find(p => p.id === selectedPlan)?.name}
                  </span>
                  ，价格{' '}
                  <span className="text-2xl font-bold text-teal-600">
                    ¥{pricingPlans.find(p => p.id === selectedPlan)?.price}
                  </span>
                  /月
                </p>

                {/* 支付方式切换 */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setPaymentMethod('alipay')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      paymentMethod === 'alipay'
                        ? 'bg-blue-50 text-blue-600 border-2 border-blue-500'
                        : 'bg-stone-100 text-stone-600 border-2 border-transparent hover:bg-stone-200'
                    }`}
                  >
                    支付宝
                  </button>
                  <button
                    onClick={() => setPaymentMethod('wechat')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      paymentMethod === 'wechat'
                        ? 'bg-green-50 text-green-600 border-2 border-green-500'
                        : 'bg-stone-100 text-stone-600 border-2 border-transparent hover:bg-stone-200'
                    }`}
                  >
                    微信支付
                  </button>
                </div>

                {/* 二维码区域 */}
                <div className="bg-white border-2 border-stone-200 rounded-xl p-6 mb-6">
                  <div className="aspect-square bg-white rounded-lg flex items-center justify-center mb-4">
                    {/* 模拟二维码 */}
                    <div className="w-48 h-48 relative">
                      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-0.5">
                        {Array.from({ length: 64 }).map((_, i) => (
                          <div
                            key={i}
                            className={`rounded-sm ${qrPattern[i] ? 'bg-stone-900' : 'bg-white'}`}
                          />
                        ))}
                      </div>
                      {/* 二维码中心图标 */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white p-2 rounded-lg shadow-md">
                          {paymentMethod === 'alipay' ? (
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-lg">支</span>
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-lg">微</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-stone-600">
                    请使用{paymentMethod === 'alipay' ? '支付宝' : '微信'}扫一扫
                  </p>
                </div>

                {/* 倒计时 */}
                <div className="text-center mb-6">
                  <p className="text-sm text-stone-500">
                    二维码有效期：
                    <span className="font-mono font-semibold text-stone-700">
                      {paymentCountdown}
                    </span>
                  </p>
                </div>

                {/* 按钮 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentSuccess(false);
                      setPaymentProcessing(false);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl border border-stone-300 text-stone-700 font-medium hover:bg-stone-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={paymentProcessing}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium hover:from-teal-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentProcessing ? '支付中...' : '我已支付'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-2">支付成功！</h3>
                <p className="text-stone-600 mb-6">
                  你已成功订阅 {pricingPlans.find(p => p.id === selectedPlan)?.name}
                </p>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentSuccess(false);
                    setPaymentProcessing(false);
                  }}
                  className="py-3 px-8 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium hover:from-teal-600 hover:to-teal-700 transition-all"
                >
                  开始使用
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
