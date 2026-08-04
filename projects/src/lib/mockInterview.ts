import type { InterviewPlayback, InterviewSegment } from '@/types/interview';

/** AI 标注颜色配置 */
export const ANNOTATION_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  'fast-pace': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  nervous: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'key-point': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'good-answer': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'pause-long': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  'filler-word': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

/** AI 标注图标映射 */
export const ANNOTATION_ICONS: Record<string, string> = {
  'fast-pace': 'Zap',
  nervous: 'AlertTriangle',
  'key-point': 'Star',
  'good-answer': 'ThumbsUp',
  'pause-long': 'Clock',
  'filler-word': 'MessageCircle',
};

/** 模拟面试片段 */
const mockSegments: InterviewSegment[] = [
  {
    id: 'seg-0',
    type: 'opening',
    role: 'interviewer',
    content: '你好！欢迎来到 Common App 模拟面试。我是你的 AI 面试官。在接下来的时间里，我会问你一些关于你自己的问题。没有标准答案，放松就好。我们先从简单的开始——请用一两分钟介绍一下你自己吧。',
    startTime: 0,
    endTime: 12,
    annotations: [],
  },
  {
    id: 'seg-1',
    type: 'answer',
    role: 'student',
    content: '您好！我叫李明，是一名来自上海的高二学生。我从小就对计算机科学和人工智能非常感兴趣。在学校里，我参加了编程社团，还组织了一个 AI 学习小组。课余时间我喜欢阅读科幻小说和打篮球。',
    startTime: 12,
    endTime: 25,
    annotations: [
      {
        type: 'fast-pace',
        label: '语速偏快',
        detail: '这段回答语速较快（约 200 字/分钟），建议在关键信息处适当放慢',
        startTime: 14,
        endTime: 20,
      },
    ],
  },
  {
    id: 'seg-2',
    type: 'question',
    role: 'interviewer',
    content: 'Thank you for sharing that. I\'d like to dig deeper — can you tell me about a time when you had to work with someone difficult? How did you handle it?',
    startTime: 25,
    endTime: 33,
    questionIndex: 1,
    annotations: [
      {
        type: 'key-point',
        label: '关键问题',
        detail: '这是一道高频面试题，考察团队协作和冲突解决能力',
        startTime: 25,
        endTime: 33,
      },
    ],
  },
  {
    id: 'seg-3',
    type: 'answer',
    role: 'student',
    content: 'That\'s a great question. Last year, I was leading a team project for our school\'s science fair. One team member had a very different vision for the project and often disagreed with my decisions. Instead of arguing, I scheduled a one-on-one meeting to understand his perspective. It turned out he had some really creative ideas that I hadn\'t considered. We ended up combining both approaches, and our project won first place.',
    startTime: 33,
    endTime: 55,
    questionIndex: 1,
    annotations: [
      {
        type: 'good-answer',
        label: '回答出色',
        detail: '使用了 STAR 法则（情境-任务-行动-结果），结构清晰',
        startTime: 33,
        endTime: 55,
      },
      {
        type: 'pause-long',
        label: '停顿 3 秒',
        detail: '在 "Instead of arguing" 前有较长停顿，可能在组织思路',
        startTime: 42,
        endTime: 45,
      },
    ],
  },
  {
    id: 'seg-4',
    type: 'question',
    role: 'interviewer',
    content: 'That\'s a great perspective. Now, thinking about your academic interests, what subject excites you the most and why?',
    startTime: 55,
    endTime: 63,
    questionIndex: 2,
    annotations: [],
  },
  {
    id: 'seg-5',
    type: 'answer',
    role: 'student',
    content: 'I\'m most excited about computer science, specifically machine learning. Um, I think it\'s because, like, it combines mathematics with real-world applications. You know, last semester I built a simple image classification model using TensorFlow, and it was amazing to see how a computer could learn to recognize different objects just from data. Um, I believe AI will fundamentally change how we live and work, and I want to be part of that transformation.',
    startTime: 63,
    endTime: 85,
    questionIndex: 2,
    annotations: [
      {
        type: 'filler-word',
        label: '填充词较多',
        detail: '出现了 3 次 "um" 和 2 次 "like/you know"，建议通过练习减少',
        startTime: 68,
        endTime: 80,
      },
    ],
  },
  {
    id: 'seg-6',
    type: 'question',
    role: 'interviewer',
    content: 'Interesting! How do you think your experiences have shaped who you are today?',
    startTime: 85,
    endTime: 90,
    questionIndex: 3,
    annotations: [
      {
        type: 'key-point',
        label: '关键问题',
        detail: '考察自我认知和反思能力，是面试中的核心问题',
        startTime: 85,
        endTime: 90,
      },
    ],
  },
  {
    id: 'seg-7',
    type: 'closing',
    role: 'system',
    content: '面试已结束，感谢你的参与。',
    startTime: 90,
    endTime: 90,
    annotations: [],
  },
];

/** 生成模拟面试回放数据 */
export function getMockPlayback(): InterviewPlayback {
  return {
    id: 'mock-playback-001',
    interviewType: 'common-app',
    audioUrl: '/mock-interview.webm',
    videoUrl: '/mock-interview.webm',
    totalDuration: 90,
    segments: mockSegments,
    createdAt: Date.now() - 3600000,
  };
}

/** 根据 ID 获取标注样式 */
export function getAnnotationStyle(type: string): { bg: string; text: string; border: string } {
  return ANNOTATION_STYLES[type] ?? ANNOTATION_STYLES['key-point'];
}
