import type { InterviewType, InterviewTypeConfig } from '@/types/interview';

/** 面试类型配置 */
export const INTERVIEW_TYPES: InterviewTypeConfig[] = [
  {
    type: 'common-app',
    title: 'Common App 面试',
    subtitle: '通用申请面试',
    description: '模拟美国大学通用申请系统的面试环节，涵盖个人经历、学术兴趣、课外活动等核心问题。',
    icon: 'graduation-cap',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
  },
  {
    type: 'alumni',
    title: '校友面试',
    subtitle: 'Alumni Interview',
    description: '模拟由校友主持的非正式面试，侧重对学校文化的理解、个人价值观和未来愿景的表达。',
    icon: 'users',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    type: 'initialview',
    title: 'Initialview 面试',
    subtitle: '第三方面试',
    description: '模拟 Initialview 第三方面试流程，包含随机提问、图片讨论和自由问答，全面考察表达能力。',
    icon: 'video',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
];

/** 根据类型获取配置 */
export function getInterviewConfig(type: InterviewType): InterviewTypeConfig | undefined {
  return INTERVIEW_TYPES.find((config) => config.type === type);
}

/** 格式化时间（秒 → mm:ss） */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/** 生成唯一 ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** 获取面试类型的开场白 */
export function getOpeningMessage(type: InterviewType): string {
  const openings: Record<InterviewType, string> = {
    'common-app':
      '你好！欢迎来到 Common App 模拟面试。我是你的 AI 面试官。在接下来的时间里，我会问你一些关于你自己的问题。没有标准答案，放松就好。我们先从简单的开始——请用一两分钟介绍一下你自己吧。',
    alumni:
      '嗨！很高兴今天能和你聊聊。我是你的校友面试官，今天的对话会比较轻松随意。我想了解的是一个真实的你——你的兴趣、你的想法、你对未来的期待。那我们先从破冰开始：最近有什么让你特别兴奋的事情吗？',
    initialview:
      '你好！欢迎参加 Initialview 模拟面试。本次面试大约持续 15-20 分钟，包含几个随机问题。请尽量用英语回答，保持自然和真实。准备好了吗？让我们开始第一个问题：What is a topic you could talk about for 30 minutes with no preparation?',
  };
  return openings[type];
}
