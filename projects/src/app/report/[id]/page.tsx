'use client';

/**
 * 报告页：展示面试评分报告、改进建议、音视频回放和时间轴标注。
 */

import { useState, useCallback, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getInterviewConfig } from '@/lib/interview-config';
import type { InterviewType, InterviewSegment, InterviewPlayback, StoredInterviewScore } from '@/types/interview';
import { getMockPlayback } from '@/lib/mockInterview';
import { AudioPlayer } from '@/components/interview/AudioPlayer';
import { Timeline } from '@/components/interview/Timeline';
import { RadarChart } from '@/components/RadarChart';
import {
  ArrowLeft,
  BarChart3,
  MessageSquare,
  TrendingUp,
  PlayCircle,
} from 'lucide-react';

type TabType = 'report' | 'playback';

const emptyScore: StoredInterviewScore = {
  totalScore: 0,
  maxScore: 100,
  grade: '待生成',
  overallComment: '未找到本次面试的评分数据，请从分析结果页重新进入报告。',
  dimensions: [],
  radarScores: {},
  strengths: [],
  improvements: ['重新完成面试后等待分析完成', '如果问题仍然存在，请确认浏览器没有清理本地数据'],
  generatedAt: 0,
};

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
  const [scoreResult, setScoreResult] = useState<StoredInterviewScore>(emptyScore);

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`interview-score-${id}`);
      if (saved) {
        setScoreResult(JSON.parse(saved));
        return;
      }
    } catch {
      // 读取失败时展示空评分状态
    }
    setScoreResult(emptyScore);
  }, [id]);

  const playbackData = playback || getMockPlayback();

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
                  {scoreResult.grade}
                </span>
              </div>
              <div className="mb-2">
                <span className="text-4xl font-bold text-stone-900">
                  {scoreResult.totalScore}
                </span>
                <span className="text-lg text-stone-400">/{scoreResult.maxScore}</span>
              </div>
              <p className="text-sm leading-relaxed text-stone-600">
                {scoreResult.overallComment}
              </p>
            </div>

            {/* 维度评分 */}
            <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-stone-900">
                <BarChart3 className="h-5 w-5 text-teal-600" />
                维度评分
              </h2>
              <div className="space-y-4">
                {scoreResult.dimensions.length === 0 && (
                  <p className="text-sm text-stone-500">暂无维度评分。</p>
                )}
                {scoreResult.dimensions.map((dim) => (
                  <div key={dim.name}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-stone-700">
                        {dim.name}
                      </span>
                      <span className="font-mono text-sm text-stone-500">
                        {dim.score}/{dim.maxScore}
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

            {/* 雷达图分析 */}
            <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-stone-900">
                <BarChart3 className="h-5 w-5 text-teal-600" />
                雷达图分析
              </h2>
              <div className="mx-auto max-w-md">
                <RadarChart scores={scoreResult.radarScores} />
              </div>
            </div>

            {/* 改进建议 */}
            <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-stone-900">
                <MessageSquare className="h-5 w-5 text-amber-600" />
                改进建议
              </h2>
              <div className="space-y-3">
                {scoreResult.improvements.map((tip, i) => (
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
