'use client';

/**
 * 题库广场页：按面试类型和能力维度展示可练习问题，并提供快速进入模拟面试入口。
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Brain,
  Clock,
  GraduationCap,
  Grid3X3,
  Play,
  Search,
  Sparkles,
  Target,
  Users,
  Video,
} from 'lucide-react';
import type { InterviewType } from '@/types/interview';

type QuestionDifficulty = '基础' | '进阶' | '压力';

interface QuestionItem {
  type: InterviewType;
  category: string;
  difficulty: QuestionDifficulty;
  question: string;
  intent: string;
  prep: string;
}

const typeLabels: Record<InterviewType | 'all', string> = {
  all: '全部',
  'common-app': 'Common App',
  alumni: '校友面试',
  initialview: 'Initialview',
};

const typeIcons: Record<InterviewType, typeof GraduationCap> = {
  'common-app': GraduationCap,
  alumni: Users,
  initialview: Video,
};

const difficultyStyles: Record<QuestionDifficulty, string> = {
  基础: 'bg-teal-50 text-teal-700',
  进阶: 'bg-amber-50 text-amber-700',
  压力: 'bg-red-50 text-red-600',
};

const questions: QuestionItem[] = [
  {
    type: 'common-app',
    category: 'Self Introduction',
    difficulty: '基础',
    question: 'Tell me a little about yourself.',
    intent: '看学生是否能清晰概括身份、兴趣和成长方向。',
    prep: '准备 60-90 秒版本，保留一个可追问细节。',
  },
  {
    type: 'common-app',
    category: 'Academic Interest',
    difficulty: '基础',
    question: 'What academic subject excites you the most, and why?',
    intent: '考察学术兴趣是否具体、有持续性。',
    prep: '讲兴趣来源、一个项目/阅读、未来想继续探索的问题。',
  },
  {
    type: 'common-app',
    category: 'Challenge',
    difficulty: '进阶',
    question: 'Describe a challenge you faced and what you learned from it.',
    intent: '看抗挫折能力、反思能力和行动力。',
    prep: '用 STAR 框架，重点说行动和反思，不要只讲困难本身。',
  },
  {
    type: 'common-app',
    category: 'Leadership',
    difficulty: '进阶',
    question: 'Tell me about a time when you demonstrated leadership.',
    intent: '判断领导力是否来自真实行动，而不是头衔。',
    prep: '说明你如何影响他人、组织资源或解决冲突。',
  },
  {
    type: 'common-app',
    category: 'Pressure',
    difficulty: '压力',
    question: 'Many students say they are passionate. What makes your experience different?',
    intent: '测试学生是否能跳出模板化回答。',
    prep: '用个人细节回答，不要继续讲抽象品质。',
  },
  {
    type: 'alumni',
    category: 'Fit',
    difficulty: '基础',
    question: 'What are you hoping to find in a school community?',
    intent: '看学生是否理解学校社区，而不是只看排名。',
    prep: '准备 2 个社区关键词，再连接自己的经历。',
  },
  {
    type: 'alumni',
    category: 'Personality',
    difficulty: '基础',
    question: 'How would your friends describe you?',
    intent: '了解真实性格和同伴关系。',
    prep: '用一个形容词加一个故事，避免堆形容词。',
  },
  {
    type: 'alumni',
    category: 'Contribution',
    difficulty: '进阶',
    question: 'What would you contribute to campus life?',
    intent: '评估学生是否能主动参与校园。',
    prep: '讲清楚你会加入什么、发起什么、带来什么氛围。',
  },
  {
    type: 'alumni',
    category: 'Values',
    difficulty: '进阶',
    question: 'Tell me about a value that matters deeply to you.',
    intent: '看价值观是否具体且稳定。',
    prep: '不要只说 kindness/hard work，要讲价值形成的经历。',
  },
  {
    type: 'alumni',
    category: 'Pressure',
    difficulty: '压力',
    question: 'Why should this school choose you over another strong applicant?',
    intent: '测试自我认知和表达自信的平衡。',
    prep: '回答“匹配点 + 证据 + 贡献”，不要自夸或贬低别人。',
  },
  {
    type: 'initialview',
    category: 'Warm-up',
    difficulty: '基础',
    question: 'What is a topic you could talk about for 30 minutes with no preparation?',
    intent: '考察自然表达和兴趣真实性。',
    prep: '选具体话题，准备 2-3 个分支点。',
  },
  {
    type: 'initialview',
    category: 'Thinking',
    difficulty: '进阶',
    question: 'What is one belief you have changed recently?',
    intent: '看思辨能力和开放心态。',
    prep: '说变化前、触发点、变化后，不要只讲结论。',
  },
  {
    type: 'initialview',
    category: 'Creative Response',
    difficulty: '进阶',
    question: 'If you could design a new class for your school, what would it be?',
    intent: '测试创意、结构和表达组织。',
    prep: '按课程目标、课堂活动、学生收获三步回答。',
  },
  {
    type: 'initialview',
    category: 'Image Discussion',
    difficulty: '基础',
    question: 'Describe a scene that made you think deeply, and explain why.',
    intent: '模拟图片讨论中的观察和解释能力。',
    prep: '先描述可见内容，再解释感受和联想。',
  },
  {
    type: 'initialview',
    category: 'Pressure',
    difficulty: '压力',
    question: 'You have only 30 seconds: what is the most important thing we should know about you?',
    intent: '看学生能否快速抓重点。',
    prep: '提前准备一句核心定位和一个证据。',
  },
];

const filters: Array<InterviewType | 'all'> = ['all', 'common-app', 'alumni', 'initialview'];

export default function QuestionBankPage() {
  const router = useRouter();
  const [activeType, setActiveType] = useState<InterviewType | 'all'>('all');
  const [query, setQuery] = useState('');

  const filteredQuestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return questions.filter((item) => {
      const matchesType = activeType === 'all' || item.type === activeType;
      const matchesQuery =
        !normalizedQuery ||
        item.question.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery) ||
        item.intent.toLowerCase().includes(normalizedQuery);
      return matchesType && matchesQuery;
    });
  }, [activeType, query]);

  const recommendedType = activeType === 'all' ? 'common-app' : activeType;

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
            aria-label="返回"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Grid3X3 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold text-stone-900">题库广场</h1>
            <p className="text-xs text-stone-500">按面试类型、难度和考察点练习高频问题</p>
          </div>
          <button
            onClick={() => router.push(`/interview/${recommendedType}`)}
            className="hidden items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 sm:flex"
          >
            <Play className="h-4 w-4" />
            开始模拟
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const Icon = filter === 'all' ? Sparkles : typeIcons[filter];
              return (
                <button
                  key={filter}
                  onClick={() => setActiveType(filter)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    activeType === filter
                      ? 'border-teal-200 bg-teal-50 text-teal-700'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {typeLabels[filter]}
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-stone-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索题目或考察点"
              className="min-w-0 flex-1 bg-transparent text-sm text-stone-700 outline-none placeholder:text-stone-400"
            />
          </label>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Target className="h-4 w-4 text-teal-600" />
              练习目标
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              每次选 5 题，优先练“具体例子”和“反思”。
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Clock className="h-4 w-4 text-amber-600" />
              时间建议
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              基础题 60-90 秒，进阶题 90-120 秒，压力题 45 秒。
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Brain className="h-4 w-4 text-indigo-600" />
              复盘标准
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              听回放时只看三件事：是否具体、是否自然、是否有成长。
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {filteredQuestions.map((item, index) => {
            const Icon = typeIcons[item.type];
            return (
              <article key={`${item.type}-${item.question}`} className="rounded-lg border border-stone-200 bg-white p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-stone-400">Q{index + 1}</span>
                        <span className="text-xs font-medium text-stone-500">{typeLabels[item.type]}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${difficultyStyles[item.difficulty]}`}>
                          {item.difficulty}
                        </span>
                      </div>
                      <h2 className="text-base font-semibold leading-relaxed text-stone-900">
                        {item.question}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/interview/${item.type}`)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white transition-colors hover:bg-teal-700"
                    aria-label={`练习 ${item.question}`}
                  >
                    <Play className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-stone-50 p-3">
                    <p className="text-xs font-semibold text-stone-500">考察点</p>
                    <p className="mt-1 text-sm leading-relaxed text-stone-700">{item.intent}</p>
                  </div>
                  <div className="rounded-lg bg-teal-50/70 p-3">
                    <p className="text-xs font-semibold text-teal-700">准备提示</p>
                    <p className="mt-1 text-sm leading-relaxed text-stone-700">{item.prep}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="rounded-lg border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
            没有找到匹配题目，换一个关键词试试。
          </div>
        )}
      </section>
    </main>
  );
}
