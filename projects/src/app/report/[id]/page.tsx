'use client';

/**
 * 报告页：展示面试评分报告、改进建议、音视频回放和时间轴标注。
 */

import { useState, useCallback, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getInterviewConfig } from '@/lib/interview-config';
import type { InterviewType, InterviewSegment, InterviewPlayback } from '@/types/interview';
import { getMockPlayback } from '@/lib/mockInterview';
import { AudioPlayer } from '@/components/interview/AudioPlayer';
import { Timeline } from '@/components/interview/Timeline';
import {
  ArrowLeft,
  BarChart3,
  Target,
  MessageSquare,
  TrendingUp,
  PlayCircle,
} from 'lucide-react';

type TabType = 'report' | 'playback';

export default function ReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = (params.id as string) ?? 'demo';
  const interviewType = (searchParams.get('type') ?? 'common-app') as InterviewType;
  const duration = searchParams.get('duration') ?? '0';
  const config = getInterviewConfig(interviewType);

  const [activeTab, setActiveTab] = useState<TabType>('report');
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTo, setSeekTo] = useState<number | null>(null);

  // 获取回放数据（优先从 localStorage 读取）
  const [playback, setPlayback] = useState<InterviewPlayback | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`interview-${id}`);
      if (saved) {
        setPlayback(JSON.parse(saved));
        return;
      }
    } catch {
      // 读取失败时使用模拟数据
    }
    setPlayback(getMockPlayback());
  }, [id]);

  const playbackData = playback || getMockPlayback();

  // 模拟评分数据
  const mockResult = {
    totalScore: 78,
    maxScore: 100,
    grade: 'B+',
    overallComment:
      '整体表现良好，能够清晰地表达自己的想法。在内容深度和语言流畅度方面还有提升空间。建议在回答中加入更多具体的个人经历和细节，以增强说服力。',
    dimensions: [
      { name: '内容质量', score: 80, comment: '观点明确，但缺少具体案例支撑' },
      { name: '语言表达', score: 75, comment: '表达较流畅，偶有停顿和重复' },
      { name: '逻辑结构', score: 82, comment: '回答有条理，层次分明' },
      { name: '自信程度', score: 78, comment: '整体自信，部分问题略显紧张' },
      { name: '互动能力', score: 76, comment: '能回应追问，但主动性可提升' },
    ],
  };

  // 处理时间轴片段点击
  const handleSegmentClick = useCallback((segment: InterviewSegment) => {
    setSeekTo(segment.startTime);
  }, []);

  // seekTo 使用后重置
  useEffect(() => {
    if (seekTo !== null) {
      const timer = setTimeout(() => setSeekTo(null), 100);
      return () => clearTimeout(timer);
    }
  }, [seekTo]);

  // 当前活跃的片段
  const activeSegment = playbackData.segments.find(
    (s: InterviewSegment) => currentTime >= s.startTime && currentTime < s.endTime
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          <button
            onClick={() => router.push('/')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
            aria-label="返回首页"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-stone-900">面试报告</h1>
            <p className="text-xs text-stone-500">
              {config?.title} | 时长 {Math.floor(Number(duration) / 60)} 分{' '}
              {Number(duration) % 60} 秒
            </p>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex gap-1 border-b border-stone-100">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'report'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              评分报告
            </button>
            <button
              onClick={() => setActiveTab('playback')}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'playback'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <PlayCircle className="h-4 w-4" />
              面试回放
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* 评分报告 Tab */}
        {activeTab === 'report' && (
          <div className="animate-[slide-up_0.3s_ease-out]">
            {/* 总分卡片 */}
            <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 text-center">
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-teal-50">
                <span className="text-3xl font-bold text-teal-700">
                  {mockResult.grade}
                </span>
              </div>
              <div className="mb-2">
                <span className="text-4xl font-bold text-stone-900">
                  {mockResult.totalScore}
                </span>
                <span className="text-lg text-stone-400">/{mockResult.maxScore}</span>
              </div>
              <p className="text-sm leading-relaxed text-stone-600">
                {mockResult.overallComment}
              </p>
            </div>

            {/* 维度评分 */}
            <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-stone-900">
                <BarChart3 className="h-5 w-5 text-teal-600" />
                维度评分
              </h2>
              <div className="space-y-4">
                {mockResult.dimensions.map((dim) => (
                  <div key={dim.name}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-stone-700">
                        {dim.name}
                      </span>
                      <span className="font-mono text-sm text-stone-500">
                        {dim.score}/100
                      </span>
                    </div>
                    <div className="mb-1 h-2 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-teal-500 transition-all duration-500"
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-stone-500">{dim.comment}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 雷达图占位 */}
            <div className="mb-6 rounded-2xl border border-dashed border-stone-300 bg-white p-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Target className="mb-3 h-10 w-10 text-stone-300" />
                <h3 className="mb-1 text-sm font-medium text-stone-500">雷达图分析</h3>
                <p className="text-xs text-stone-400">
                  此功能将在后续版本中实现，展示各维度能力的可视化对比
                </p>
              </div>
            </div>

            {/* 改进建议 */}
            <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-stone-900">
                <MessageSquare className="h-5 w-5 text-amber-600" />
                改进建议
              </h2>
              <div className="space-y-3">
                {[
                  '在回答中多使用 STAR 法则（情境-任务-行动-结果）来组织你的故事',
                  '练习减少填充词（如 "um"、"like"），可以通过录音回听来识别',
                  '准备 3-5 个核心故事，灵活应对不同类型的面试问题',
                  '注意语速控制，重要观点前适当停顿，增强表达力度',
                ].map((tip, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-lg bg-amber-50 p-3"
                  >
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-sm text-stone-700">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                返回首页
              </button>
              <button
                onClick={() => setActiveTab('playback')}
                className="flex-1 rounded-xl bg-teal-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-800"
              >
                查看回放
              </button>
            </div>
          </div>
        )}

        {/* 面试回放 Tab */}
        {activeTab === 'playback' && (
          <div className="animate-[slide-up_0.3s_ease-out]">
            {/* 视频播放器 */}
            {playbackData.videoUrl && (
              <div className="mb-6">
                <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-stone-900">
                    <PlayCircle className="h-5 w-5 text-teal-600" />
                    面试录像
                  </h2>
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-stone-900">
                    <video
                      src={playbackData.videoUrl}
                      controls
                      className="h-full w-full object-contain"
                      onTimeUpdate={(e) => {
                        const video = e.target as HTMLVideoElement;
                        setCurrentTime(video.currentTime);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 音频播放器 */}
            <div className="mb-6">
              <AudioPlayer
                src={playbackData.audioUrl}
                totalDuration={playbackData.totalDuration}
                onTimeUpdate={setCurrentTime}
                seekTo={seekTo}
              />
            </div>

            {/* 当前播放位置信息 */}
            {activeSegment && (
              <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3">
                <p className="text-xs font-medium text-teal-700">正在播放</p>
                <p className="mt-0.5 text-sm text-teal-800 line-clamp-1">
                  {activeSegment.content}
                </p>
              </div>
            )}

            {/* 时间轴 + 对话记录 */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-stone-900">
                <PlayCircle className="h-5 w-5 text-teal-600" />
                面试回放时间轴
              </h2>
              <Timeline
                segments={playbackData.segments}
                currentTime={currentTime}
                onSegmentClick={handleSegmentClick}
              />
            </div>

            {/* 标注图例 */}
            <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
              <h3 className="mb-3 text-sm font-medium text-stone-700">AI 标注说明</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { type: 'fast-pace', label: '语速快', desc: '语速超过正常范围' },
                  { type: 'nervous', label: '情绪紧张', desc: '检测到紧张信号' },
                  { type: 'key-point', label: '关键问题', desc: '面试核心考察点' },
                  { type: 'good-answer', label: '回答出色', desc: '高质量回答' },
                  { type: 'pause-long', label: '停顿过长', desc: '超过 3 秒的停顿' },
                  { type: 'filler-word', label: '填充词', desc: '频繁使用 um/like 等' },
                ].map((item) => (
                  <span
                    key={item.type}
                    className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-2.5 py-1 text-[11px] text-stone-600"
                    title={item.desc}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                返回首页
              </button>
              <button
                onClick={() => router.push(`/interview/${interviewType}`)}
                className="flex-1 rounded-xl bg-teal-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-800"
              >
                再次练习
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
