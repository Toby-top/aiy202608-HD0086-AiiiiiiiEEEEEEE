'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Grid3X3, Play } from 'lucide-react';
import type { InterviewType } from '@/types/interview';

const questionSets: Array<{
  type: InterviewType;
  title: string;
  subtitle: string;
  questions: string[];
}> = [
  {
    type: 'common-app',
    title: 'Common App 面试',
    subtitle: '个人经历、学术兴趣与成长故事',
    questions: [
      'Tell me a little about yourself.',
      'What academic subject excites you the most, and why?',
      'Describe a challenge you faced and what you learned.',
    ],
  },
  {
    type: 'alumni',
    title: '校友面试',
    subtitle: '学校匹配度、价值观与交流感',
    questions: [
      'What are you hoping to find in a school community?',
      'How would your friends describe you?',
      'What would you contribute to campus life?',
    ],
  },
  {
    type: 'initialview',
    title: 'Initialview 面试',
    subtitle: '随机提问、表达流畅度与临场反应',
    questions: [
      'What is a topic you could talk about for 30 minutes?',
      'Describe a picture or scene that made you think deeply.',
      'What is one belief you have changed recently?',
    ],
  },
];

export default function QuestionBankPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
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
          <div>
            <h1 className="text-sm font-semibold text-stone-900">题库广场</h1>
            <p className="text-xs text-stone-500">按面试类型练习高频问题</p>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 py-8 lg:grid-cols-3">
        {questionSets.map((set) => (
          <article key={set.type} className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-stone-900">{set.title}</h2>
                <p className="mt-1 text-xs text-stone-500">{set.subtitle}</p>
              </div>
              <button
                onClick={() => router.push(`/interview/${set.type}`)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white transition-colors hover:bg-teal-700"
                aria-label={`开始${set.title}`}
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {set.questions.map((question, index) => (
                <div key={question} className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
                  <span className="mr-2 text-xs font-medium text-stone-400">Q{index + 1}</span>
                  {question}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
