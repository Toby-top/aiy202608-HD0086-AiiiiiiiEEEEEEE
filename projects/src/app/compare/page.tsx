'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RadarChart, MultiRadarChart } from '@/components/RadarChart';
import { DIMENSION_LABELS, type InterviewRecord, type ScoreReport } from '@/lib/interview-prompt';

interface StudentScore {
  id: string;
  name: string;
  scores: Record<string, { score: number; comment: string }>;
  totalScore: number;
  grade: string;
  summary: string;
}

export default function ComparePage() {
  const router = useRouter();
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<StudentScore[]>([]);
  const [isScoring, setIsScoring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('interview_records');
    if (stored) {
      setRecords(JSON.parse(stored));
    }
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size < 10) next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  };

  const handleBatchScore = async () => {
    if (selectedIds.size < 2) return;
    setIsScoring(true);

    try {
      const students = records
        .filter(r => selectedIds.has(r.id))
        .map((r, i) => ({
          id: r.id,
          name: `学生${String.fromCharCode(65 + i)}`,
          messages: r.messages,
          interviewType: r.interviewType,
        }));

      const response = await fetch('/api/score/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students }),
      });

      const data = await response.json();
      if (data.results) {
        setScores(data.results);
      }
    } catch (error) {
      console.error('Batch score error:', error);
    } finally {
      setIsScoring(false);
    }
  };

  const handleExportCSV = () => {
    if (scores.length === 0) return;
    setIsExporting(true);

    try {
      const dimensions = Object.keys(DIMENSION_LABELS);
      const headers = ['学生', '总分', '等级', ...dimensions.map(d => DIMENSION_LABELS[d]), '总评'];
      const rows = scores.map(s => [
        s.name,
        s.totalScore.toFixed(1),
        s.grade,
        ...dimensions.map(d => s.scores[d]?.score.toFixed(1) || '-'),
        s.summary,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `面试对比报告_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    if (scores.length === 0) return;
    const jsonStr = JSON.stringify(scores, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `面试对比报告_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-success bg-success/10';
      case 'B': return 'text-primary bg-primary/10';
      case 'C': return 'text-warning bg-warning/10';
      case 'D': return 'text-error bg-error/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-success';
    if (score >= 7.5) return 'text-primary';
    if (score >= 6) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-serif text-lg font-semibold text-foreground">学生对比</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {records.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">暂无面试记录</h2>
            <p className="text-muted-foreground mb-8">完成面试后，可以在这里对比多个学生的表现</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              开始面试
            </button>
          </div>
        ) : (
          <>
            {/* Student Selection */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-foreground">选择学生进行对比</h2>
                  <p className="text-sm text-muted-foreground mt-1">选择 2-10 个学生进行横向对比分析</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={selectAll}
                    className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                  >
                    {selectedIds.size === records.length ? '取消全选' : '全选'}
                  </button>
                  <button
                    onClick={handleBatchScore}
                    disabled={selectedIds.size < 2 || isScoring}
                    className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isScoring ? '评分中...' : `对比评分 (${selectedIds.size})`}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {records.map((record, index) => {
                  const isSelected = selectedIds.has(record.id);
                  const studentLabel = `学生${String.fromCharCode(65 + index)}`;
                  return (
                    <button
                      key={record.id}
                      onClick={() => toggleSelect(record.id)}
                      className={`
                        p-4 rounded-xl border-2 text-left transition-all
                        ${isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/30'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{studentLabel}</span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {record.messages.filter(m => m.role === 'user').length} 轮对话
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(record.startTime).toLocaleString('zh-CN')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comparison Results */}
            {scores.length >= 2 && (
              <div className="space-y-8">
                {/* Radar Chart Comparison */}
                <div className="card p-6">
                  <h3 className="font-serif text-lg font-bold text-foreground mb-4">维度对比雷达图</h3>
                  <div className="max-w-lg mx-auto">
                    <MultiRadarChart scores={scores.map(s => ({
                      name: s.name,
                      scores: Object.fromEntries(
                        Object.entries(s.scores).map(([k, v]) => [k, v.score])
                      ),
                    }))} />
                  </div>
                </div>

                {/* Comparison Table */}
                <div className="card p-6 overflow-x-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-lg font-bold text-foreground">横向对比表格</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportCSV}
                        disabled={isExporting}
                        className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                      >
                        导出 CSV
                      </button>
                      <button
                        onClick={handleExportJSON}
                        disabled={isExporting}
                        className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                      >
                        导出 JSON
                      </button>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">维度</th>
                        {scores.map(s => (
                          <th key={s.id} className="text-center py-3 px-2 font-medium text-foreground">{s.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(DIMENSION_LABELS).map(([key, label]) => (
                        <tr key={key} className="border-b border-border/50">
                          <td className="py-3 px-2 text-muted-foreground">{label}</td>
                          {scores.map(s => (
                            <td key={s.id} className={`text-center py-3 px-2 font-medium ${getScoreColor(s.scores[key]?.score || 0)}`}>
                              {s.scores[key]?.score.toFixed(1) || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-muted/30 font-bold">
                        <td className="py-3 px-2 text-foreground">综合评分</td>
                        {scores.map(s => (
                          <td key={s.id} className={`text-center py-3 px-2 ${getScoreColor(s.totalScore)}`}>
                            {s.totalScore.toFixed(1)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-2 text-muted-foreground">等级</td>
                        {scores.map(s => (
                          <td key={s.id} className="text-center py-3 px-2">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${getGradeColor(s.grade)}`}>
                              {s.grade}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-2 text-muted-foreground">录取建议</td>
                        {scores.map(s => (
                          <td key={s.id} className="text-center py-3 px-2 text-xs text-muted-foreground">
                            {s.grade === 'A' ? '优先录取' : s.grade === 'B' ? '可以录取' : s.grade === 'C' ? '候补/拒绝' : '拒绝'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Individual Summaries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scores.map(s => (
                    <div key={s.id} className="card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-serif font-bold text-foreground">{s.name}</h4>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${getGradeColor(s.grade)}`}>
                          {s.grade}级 · {s.totalScore.toFixed(1)}分
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
