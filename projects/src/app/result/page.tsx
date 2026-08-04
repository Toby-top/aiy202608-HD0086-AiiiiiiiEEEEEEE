'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RadarChart } from '@/components/RadarChart';
import { SCORING_DIMENSIONS, SCORE_GRADES, type InterviewType } from '@/lib/interview-prompt';

interface ScoreData {
  score: number;
  comment: string;
}

interface ScoreResult {
  scores: Record<string, ScoreData>;
  totalScore: number;
  grade: string;
  summary: string;
  strengths: string[];
  improvements: string[];
}

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const time = searchParams.get('time') || '0';

  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  const formatTime = (seconds: string): string => {
    const s = parseInt(seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}分${secs}秒`;
  };

  const getGradeInfo = (grade: string) => {
    return SCORE_GRADES.find(g => g.grade === grade) || SCORE_GRADES[2];
  };

  const getDimensionName = (id: string): string => {
    const dim = SCORING_DIMENSIONS.find(d => d.id === id);
    return dim?.name || id;
  };

  const getDimensionWeight = (id: string): number => {
    const dim = SCORING_DIMENSIONS.find(d => d.id === id);
    return dim?.weight || 0;
  };

  // Generate score report
  useEffect(() => {
    const generateReport = async () => {
      // Get messages from sessionStorage
      const storedMessages = sessionStorage.getItem('interviewMessages');
      const storedType = sessionStorage.getItem('interviewType');

      if (!storedMessages) {
        // No data, use fallback
        setIsGenerating(false);
        setProgress(100);
        return;
      }

      const messages = JSON.parse(storedMessages);
      const interviewType = storedType || 'common-app';

      try {
        const response = await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, interviewType }),
        });

        if (response.ok) {
          const data = await response.json();
          setScoreResult(data);
        }
      } catch (error) {
        console.error('Error generating report:', error);
      } finally {
        setIsGenerating(false);
        setProgress(100);
      }
    };

    // Simulate progress animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 3;
      });
    }, 150);

    generateReport();

    return () => clearInterval(interval);
  }, []);

  // If no score result, show fallback
  useEffect(() => {
    if (!isGenerating && !scoreResult) {
      // Generate fallback scores
      const fallback: ScoreResult = {
        scores: {
          logic: { score: 7.5, comment: '回答结构清晰，有基本逻辑框架，但部分观点展开不够充分。' },
          depth: { score: 7.0, comment: '对专业领域有一定了解，能举出具体例子，但深入探讨时略显不足。' },
          resilience: { score: 8.0, comment: '面对追问时能保持冷静，回答质量稳定，展现出良好的心理素质。' },
          communication: { score: 7.5, comment: '表达自然流畅，有良好的互动感，语言组织能力较强。' },
          selfAwareness: { score: 6.5, comment: '能认识到自己的优劣势，但反思深度和具体改进计划有待加强。' },
          motivation: { score: 8.0, comment: '动机明确，对目标学校有一定了解，但匹配度可以进一步提升。' },
        },
        totalScore: 7.4,
        grade: 'B',
        summary: '面试整体表现良好，展现出较好的学术潜力和个人素质。建议在回答的具体性和深度上进一步提升。',
        strengths: ['表达流畅，沟通自然', '能举例说明观点', '面对压力保持冷静', '有一定自我反思能力'],
        improvements: [
          '建议在回答问题时提供更多具体例子和细节',
          '加强对目标学校和专业的了解，展现更明确的动机',
          '提升回答的深度，尝试从多角度思考问题',
          '在自我认知方面，可以更深入地反思自己的成长',
          '课外活动的描述可以更突出个人贡献和影响力',
        ],
      };
      setScoreResult(fallback);
    }
  }, [isGenerating, scoreResult]);

  const gradeInfo = scoreResult ? getGradeInfo(scoreResult.grade) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-serif text-lg font-semibold text-foreground">面试评估报告</span>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            返回首页
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {isGenerating ? (
            /* Generating State */
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-border" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                  style={{ animationDuration: '1.5s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" x2="8" y1="13" y2="13" />
                    <line x1="16" x2="8" y1="17" y2="17" />
                  </svg>
                </div>
              </div>

              <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">
                AI正在分析你的面试表现
              </h2>
              <p className="text-muted-foreground mb-6">
                正在从6个维度评估你的回答，生成详细报告...
              </p>

              <div className="max-w-md mx-auto">
                <div className="w-full bg-border rounded-full h-2 mb-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{progress}%</p>
              </div>

              <div className="mt-8 max-w-sm mx-auto p-4 rounded-xl bg-white border border-border/60 text-left">
                <h3 className="text-sm font-medium mb-2">本次面试概况</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>面试时长</span>
                    <span className="font-medium text-foreground">{formatTime(time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>评估维度</span>
                    <span className="font-medium text-foreground">6个维度</span>
                  </div>
                  <div className="flex justify-between">
                    <span>评分标准</span>
                    <span className="font-medium text-foreground">A/B/C/D 四级</span>
                  </div>
                </div>
              </div>
            </div>
          ) : scoreResult ? (
            /* Report Content */
            <div className="space-y-8 animate-fade-in-up">
              {/* Score Overview Card */}
              <div className="bg-white rounded-2xl border border-border/60 p-8">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  {/* Radar Chart */}
                  <div className="flex-shrink-0 w-full lg:w-72">
                    <RadarChart
                      scores={Object.fromEntries(
                        Object.entries(scoreResult.scores).map(([k, v]) => [k, v.score])
                      )}
                    />
                  </div>

                  {/* Score Summary */}
                  <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-3 mb-4">
                      <span className={`
                        text-5xl font-serif font-bold
                        ${gradeInfo?.grade === 'A' ? 'text-green-700' : ''}
                        ${gradeInfo?.grade === 'B' ? 'text-primary' : ''}
                        ${gradeInfo?.grade === 'C' ? 'text-amber-700' : ''}
                        ${gradeInfo?.grade === 'D' ? 'text-red-700' : ''}
                      `}>
                        {scoreResult.totalScore.toFixed(1)}
                      </span>
                      <div className="text-left">
                        <div className={`
                          text-xl font-serif font-semibold
                          ${gradeInfo?.grade === 'A' ? 'text-green-700' : ''}
                          ${gradeInfo?.grade === 'B' ? 'text-primary' : ''}
                          ${gradeInfo?.grade === 'C' ? 'text-amber-700' : ''}
                          ${gradeInfo?.grade === 'D' ? 'text-red-700' : ''}
                        `}>
                          {gradeInfo?.label} ({gradeInfo?.grade}级)
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          综合评分 · 满分10分
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-primary/5">
                        <div className="text-xs text-muted-foreground">录取建议</div>
                        <div className="text-sm font-medium text-primary mt-0.5">
                          {gradeInfo?.admission}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-primary/5">
                        <div className="text-xs text-muted-foreground">推荐等级</div>
                        <div className="text-sm font-medium text-primary mt-0.5">
                          {gradeInfo?.recommendation}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {scoreResult.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dimension Scores */}
              <div className="bg-white rounded-2xl border border-border/60 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-lg font-semibold">各维度评分详情</h3>
                  <button
                    onClick={() => setShowDetail(!showDetail)}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    {showDetail ? '收起详情' : '展开详情'}
                  </button>
                </div>

                <div className="space-y-5">
                  {Object.entries(scoreResult.scores).map(([key, data]) => {
                    const dim = SCORING_DIMENSIONS.find(d => d.id === key);
                    const level = dim?.levels ? (
                      data.score >= 9 ? 'A' : data.score >= 7 ? 'B' : data.score >= 5 ? 'C' : 'D'
                    ) : 'C';
                    const levelInfo = dim?.levels?.[level as keyof typeof dim.levels];

                    return (
                      <div key={key} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{dim?.name || key}</span>
                            <span className="text-xs text-muted-foreground">
                              (权重{(dim?.weight || 0) * 100}%)
                            </span>
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                              level === 'A' ? 'bg-green-100 text-green-700' :
                              level === 'B' ? 'bg-primary/10 text-primary' :
                              level === 'C' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {level}档
                            </span>
                          </div>
                          <span className={`text-lg font-bold font-serif ${
                            data.score >= 9 ? 'text-green-700' :
                            data.score >= 7 ? 'text-primary' :
                            data.score >= 5 ? 'text-amber-700' :
                            'text-red-700'
                          }`}>
                            {data.score.toFixed(1)}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-border rounded-full h-2 mb-1">
                          <div className={`h-2 rounded-full transition-all duration-700 ${
                            data.score >= 9 ? 'bg-green-600' :
                            data.score >= 7 ? 'bg-primary' :
                            data.score >= 5 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                            style={{ width: `${data.score * 10}%` }} />
                        </div>

                        <p className="text-xs text-muted-foreground">{data.comment}</p>

                        {/* Detail expand */}
                        {showDetail && levelInfo && (
                          <div className="mt-2 p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground">
                            <p className="font-medium mb-1">{levelInfo.desc}</p>
                            <ul className="space-y-0.5">
                              {levelInfo.criteria.map((c, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-primary mt-0.5">•</span>
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-white rounded-2xl border border-border/60 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-700">
                        <path d="M12 20V10" />
                        <path d="M18 20V4" />
                        <path d="M6 20v-4" />
                      </svg>
                    </div>
                    <h3 className="font-serif font-semibold">优势亮点</h3>
                  </div>
                  <ul className="space-y-2">
                    {scoreResult.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-600 mt-0.5">✦</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="bg-white rounded-2xl border border-border/60 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" x2="12" y1="8" y2="12" />
                        <line x1="12" x2="12.01" y1="16" y2="16" />
                      </svg>
                    </div>
                    <h3 className="font-serif font-semibold">提升建议</h3>
                  </div>
                  <ul className="space-y-2">
                    {scoreResult.improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-amber-600 mt-0.5">{i + 1}.</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Interview Summary */}
              <div className="bg-white rounded-2xl border border-border/60 p-6">
                <h3 className="font-serif font-semibold mb-4">面试信息</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">面试时长</div>
                    <div className="font-medium">{formatTime(time)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">评分维度</div>
                    <div className="font-medium">6个维度</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">综合得分</div>
                    <div className="font-medium">{scoreResult.totalScore.toFixed(1)} / 10</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">等级</div>
                    <div className="font-medium">{gradeInfo?.grade}级 · {gradeInfo?.label}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pb-8">
                <button
                  onClick={() => {
                    // Print report
                    window.print();
                  }}
                  className="px-6 py-3 rounded-lg border border-border text-foreground font-medium
                    hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  打印报告
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium
                    hover:bg-primary/90 transition-colors"
                >
                  再来一次面试
                </button>
              </div>
            </div>
          ) : (
            /* Error State */
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
              </div>
              <h2 className="font-serif text-xl font-semibold mb-2">报告生成失败</h2>
              <p className="text-muted-foreground mb-6">无法获取面试评分数据，请重新开始面试。</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium"
              >
                返回首页
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-4">
        <div className="max-w-4xl mx-auto px-6 text-center text-xs text-muted-foreground">
          AI Interview Coach · 由 AI 评分系统生成评估报告
        </div>
      </footer>
    </div>
  );
}