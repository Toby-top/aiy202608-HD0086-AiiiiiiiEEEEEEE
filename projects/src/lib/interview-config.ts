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
      "Hello! Welcome to your Common App mock interview. I'm your AI interviewer today. There are no right or wrong answers here, so please relax and be yourself. Let's start with something simple: could you introduce yourself in one or two minutes?",
    alumni:
      "Hi! It's great to meet you. I'll be your alumni interviewer today, and this conversation can feel relaxed and informal. I'd love to get to know the real you: your interests, your ideas, and what you're excited about. To start, what is something you've been genuinely excited about recently?",
    initialview:
      'Hello! Welcome to your Initialview mock interview. This interview will take about 15 to 20 minutes and include several short questions. Please answer in English and keep your responses natural and authentic. Ready? Here is the first question: what is a topic you could talk about for 30 minutes with no preparation?',
  };
  return openings[type];
}
