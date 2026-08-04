'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';

const knowledgeItems = [
  {
    title: '自我介绍',
    points: ['用 60-90 秒建立清晰身份', '包含兴趣、经历和申请动机', '避免背稿感'],
  },
  {
    title: '学术兴趣',
    points: ['说清楚兴趣来源', '加入项目或阅读细节', '连接未来学习方向'],
  },
  {
    title: '活动与领导力',
    points: ['聚焦一个具体场景', '说明你的角色和行动', '总结可迁移的成长'],
  },
  {
    title: 'Why School',
    points: ['提到具体课程或资源', '说明你能贡献什么', '避免泛泛夸学校'],
  },
];

export default function KnowledgePage() {
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-stone-900">知识库</h1>
            <p className="text-xs text-stone-500">面试回答结构与高频表达素材</p>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 py-8 sm:grid-cols-2">
        {knowledgeItems.map((item) => (
          <article key={item.title} className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="text-base font-semibold text-stone-900">{item.title}</h2>
            <div className="mt-4 space-y-3">
              {item.points.map((point) => (
                <div key={point} className="flex items-start gap-2 text-sm text-stone-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
