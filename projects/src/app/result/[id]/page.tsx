'use client';

/**
 * 动态结果生成页：展示面试结束后的分析进度，并跳转到报告与回放页。
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';
import type { InterviewPlayback, ScoringApiResult, StoredInterviewScore } from '@/types/interview';

const steps = [
  '正在整理面试记录...',
  '正在分析回答质量...',
  '正在评估表达流畅度...',
  '正在生成综合报告...',
];

const DIMENSION_LABELS: Record<string, string> = {
  logic: '逻辑结构',
  depth: '内容深度',
  resilience: '追问应对',
  communication: '语言表达',
  'self-awareness': '自我认知',
  motivation: '申请动机',
};

function toStoredScore(result: ScoringApiResult): StoredInterviewScore {
  const radarScores = Object.fromEntries(
    Object.entries(result.scores).map(([key, value]) => [key, value.score])
  );

  return {
    totalScore: Math.round(result.totalScore * 10),
    maxScore: 100,
    grade: result.grade,
    overallComment: result.summary,
    dimensions: Object.entries(result.scores).map(([key, value]) => ({
      name: DIMENSION_LABELS[key] ?? key,
      score: Math.round(value.score * 10),
      maxScore: 100,
      comment: value.comment,
    })),
    radarScores,
    strengths: result.strengths ?? [],
    improvements: result.improvements ?? [],
    generatedAt: Date.now(),
  };
}

export default function ResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const resultId = params.id as string;
  const interviewType = searchParams.get('type') ?? 'common-app';
  const duration = searchParams.get('duration') ?? '0';

  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 分析进度兜底动画，真实评分完成后会直接收束到100。
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, []);

  // 更新当前步骤
  useEffect(() => {
    const stepIndex = Math.min(Math.floor(progress / 25), steps.length - 1);
    setCurrentStep(stepIndex);

    if (progress >= 100) {
      setIsComplete(true);
    }
  }, [progress]);

  useEffect(() => {
    let cancelled = false;

    async function generateScore() {
      try {
        setProgress((prev) => Math.max(prev, 15));
        const saved = localStorage.getItem(`interview-${resultId}`);
        if (!saved) {
          throw new Error('Missing interview playback data');
        }

        const playback = JSON.parse(saved) as InterviewPlayback;
        const scoreResponse = await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewType,
            messages: (playback.messages ?? []).map((message) => ({
              role: message.role === 'student' ? 'user' : 'assistant',
              content: message.content,
            })),
          }),
        });

        if (!scoreResponse.ok) {
          throw new Error(`Score request failed: ${scoreResponse.status}`);
        }

        setProgress((prev) => Math.max(prev, 75));
        const scoreResult = (await scoreResponse.json()) as ScoringApiResult;
        const storedScore = toStoredScore(scoreResult);
        localStorage.setItem(`interview-score-${resultId}`, JSON.stringify(storedScore));

        if (!cancelled) {
          setProgress(100);
          setIsComplete(true);
        }
      } catch {
        if (!cancelled) {
          const fallbackScore = toStoredScore({
            scores: {
              logic: { score: 1, comment: '评分生成失败，未能读取有效面试记录。' },
              depth: { score: 1, comment: '评分生成失败，缺少可评估内容。' },
              resilience: { score: 1, comment: '评分生成失败，无法评估追问应对。' },
              communication: { score: 1, comment: '评分生成失败，无法评估表达质量。' },
              'self-awareness': { score: 1, comment: '评分生成失败，无法评估自我认知。' },
              motivation: { score: 1, comment: '评分生成失败，无法评估申请动机。' },
            },
            totalScore: 1,
            grade: 'D',
            summary: '未能生成有效评分，请确认面试记录存在并重新生成报告。',
            strengths: [],
            improvements: ['重新完成一次有效录音', '确认浏览器允许麦克风权限'],
          });
          localStorage.setItem(`interview-score-${resultId}`, JSON.stringify(fallbackScore));
          setProgress(100);
          setIsComplete(true);
        }
      }
    }

    generateScore();

    return () => {
      cancelled = true;
    };
  }, [resultId, interviewType]);

  // 跳转到报告页
  const handleViewReport = useCallback(() => {
    router.push(`/report/${resultId}?type=${interviewType}&duration=${duration}`);
  }, [router, resultId, interviewType, duration]);

  // 完成后自动跳转
  useEffect(() => {
    if (isComplete) {
      const timeout = setTimeout(handleViewReport, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isComplete, handleViewReport]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6">
      <div className="w-full max-w-sm text-center">
        {/* 动画图标 */}
        <div className="mb-8 flex justify-center">
          {isComplete ? (
            <div className="animate-[scale-in_0.3s_ease-out]">
              <CheckCircle2 className="h-16 w-16 text-teal-600" />
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-teal-100 opacity-50" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            </div>
          )}
        </div>

        {/* 标题 */}
        <h1 className="mb-2 text-xl font-semibold tracking-tight text-stone-900">
          {isComplete ? '分析完成！' : 'AI 正在分析你的面试表现...'}
        </h1>
        <p className="mb-8 text-sm text-stone-500">
          {isComplete ? '即将为你生成详细报告' : '请稍候，这需要几秒钟'}
        </p>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-teal-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-right font-mono text-xs text-stone-400">{progress}%</p>
        </div>

        {/* 步骤列表 */}
        <div className="space-y-3 text-left">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`flex items-center gap-3 transition-opacity duration-300 ${
                index <= currentStep ? 'opacity-100' : 'opacity-30'
              }`}
            >
              {index < currentStep || isComplete ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
              ) : index === currentStep ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-teal-500" />
              ) : (
                <div className="h-4 w-4 shrink-0 rounded-full border-2 border-stone-300" />
              )}
              <span
                className={`text-sm ${
                  index <= currentStep ? 'text-stone-700' : 'text-stone-400'
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* 手动跳转按钮 */}
        {isComplete && (
          <button
            onClick={handleViewReport}
            className="mt-8 rounded-xl bg-teal-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-800"
          >
            查看报告
          </button>
        )}
      </div>
    </div>
  );
}
