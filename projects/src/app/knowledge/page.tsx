'use client';

/**
 * 知识库页：沉淀国际高中/海外申请面试的回答框架、英文表达和练习清单。
 */

import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  MessageCircle,
  Route,
  Sparkles,
  Target,
} from 'lucide-react';

const answerFrameworks = [
  {
    title: '自我介绍：Identity + Evidence + Direction',
    summary: '先给身份标签，再用一个真实经历支撑，最后连接未来目标。',
    example:
      "I'm a student who is curious about how technology changes learning. Last year, I built a small vocabulary tool for my classmates, and that made me want to study human-centered design more seriously.",
    checklist: ['不要罗列简历', '控制在 60-90 秒', '留下一个可追问的细节'],
  },
  {
    title: '经历题：STAR + Reflection',
    summary: 'Situation 只讲必要背景，把重点放在行动、结果和反思。',
    example:
      'At first, our club had only six active members. I redesigned our weekly meetings around small project teams, and by the end of the semester we had three student-led events. I learned that leadership is more about creating ownership than giving instructions.',
    checklist: ['行动必须是你做的', '结果尽量具体', '最后一句说成长'],
  },
  {
    title: 'Why School：Resource + Fit + Contribution',
    summary: '说具体资源，解释为什么适合你，再说明你能带来什么。',
    example:
      "I'm drawn to your project-based computer science curriculum because I learn best by building. I would also love to contribute to the robotics club by bringing my experience organizing peer workshops.",
    checklist: ['避免 “good reputation”', '提到课程/社团/项目', '说清楚双向匹配'],
  },
  {
    title: '弱点题：Honesty + Control + Progress',
    summary: '选择真实但可改进的弱点，说明你已经在采取行动。',
    example:
      "I used to hesitate before speaking in group discussions because I wanted my ideas to be perfect. I've been practicing by sharing a first thought earlier, then improving it through conversation.",
    checklist: ['不要说伪弱点', '不要选致命缺陷', '必须有改进证据'],
  },
];

const phraseGroups = [
  {
    title: '自然开头',
    phrases: [
      'One experience that shaped me was...',
      'What first got me interested in this was...',
      'I would describe myself as someone who...',
    ],
  },
  {
    title: '深入反思',
    phrases: [
      'Looking back, I realized that...',
      'That experience changed the way I think about...',
      'The most important lesson for me was...',
    ],
  },
  {
    title: '承接追问',
    phrases: [
      'A specific example would be...',
      'To give you more context...',
      'What I did personally was...',
    ],
  },
  {
    title: '争取思考时间',
    phrases: [
      "That's a thoughtful question. Let me think for a second.",
      'I have two thoughts on that.',
      'I would approach that from both a personal and academic angle.',
    ],
  },
];

const practicePlan = [
  { day: '第 1 天', task: '录一版 90 秒自我介绍，检查是否有身份、证据和方向。' },
  { day: '第 2 天', task: '准备 3 个 STAR 故事：学术、活动、挑战各一个。' },
  { day: '第 3 天', task: '练 8 个追问，把每个回答压到 2 分钟内。' },
  { day: '第 4 天', task: '做一次完整模拟面试，只复盘一个最大问题。' },
  { day: '第 5 天', task: '补学校调研，写 3 条 Why School 的具体证据。' },
];

const pitfalls = [
  '回答太像作文：面试要像自然对话，不要背完整稿。',
  '只讲结果不讲过程：招生官更想看你如何思考和行动。',
  '例子太大太空：一个小但真实的细节，比宏大口号更可信。',
  '每题都讲同一个经历：提前准备 4-5 个不同素材。',
  '忘记反问：最后至少准备 2 个关于课程、社区或成长机会的问题。',
];

export default function KnowledgePage() {
  const router = useRouter();

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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-stone-900">知识库</h1>
            <p className="text-xs text-stone-500">面试回答框架、英文表达与练习清单</p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="mb-5 flex items-center gap-2">
              <Target className="h-5 w-5 text-teal-600" />
              <h2 className="text-base font-semibold text-stone-900">高频回答框架</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {answerFrameworks.map((item) => (
                <article key={item.title} className="rounded-lg bg-stone-50 p-4">
                  <h3 className="text-sm font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.summary}</p>
                  <p className="mt-3 rounded-lg bg-white p-3 text-sm leading-relaxed text-stone-700">
                    {item.example}
                  </p>
                  <div className="mt-3 space-y-2">
                    {item.checklist.map((point) => (
                      <div key={point} className="flex items-start gap-2 text-xs text-stone-600">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-lg border border-stone-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Route className="h-5 w-5 text-amber-600" />
                <h2 className="text-base font-semibold text-stone-900">5 天练习计划</h2>
              </div>
              <div className="space-y-3">
                {practicePlan.map((item) => (
                  <div key={item.day} className="rounded-lg bg-amber-50/60 p-3">
                    <p className="text-xs font-semibold text-amber-700">{item.day}</p>
                    <p className="mt-1 text-sm leading-relaxed text-stone-700">{item.task}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-stone-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-teal-600" />
                <h2 className="text-base font-semibold text-stone-900">避坑清单</h2>
              </div>
              <div className="space-y-3">
                {pitfalls.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm leading-relaxed text-stone-600">
                    <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-4 rounded-lg border border-stone-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-teal-600" />
            <h2 className="text-base font-semibold text-stone-900">可直接套用的英文表达</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {phraseGroups.map((group) => (
              <article key={group.title} className="rounded-lg bg-stone-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-stone-900">{group.title}</h3>
                </div>
                <div className="space-y-2">
                  {group.phrases.map((phrase) => (
                    <p key={phrase} className="rounded-md bg-white px-3 py-2 text-sm leading-relaxed text-stone-700">
                      {phrase}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
