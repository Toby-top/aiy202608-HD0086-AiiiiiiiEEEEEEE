'use client';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { DIMENSION_LABELS } from '@/lib/interview-prompt';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const COLORS = [
  { bg: 'rgba(26, 58, 42, 0.15)', border: 'rgba(26, 58, 42, 0.8)' },
  { bg: 'rgba(201, 149, 60, 0.15)', border: 'rgba(201, 149, 60, 0.8)' },
  { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.8)' },
  { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.8)' },
  { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.8)' },
  { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.8)' },
];

interface RadarChartProps {
  scores: Record<string, number>;
}

interface MultiRadarChartProps {
  scores: { name: string; scores: Record<string, number> }[];
}

export function RadarChart({ scores }: RadarChartProps) {
  const labels = Object.keys(DIMENSION_LABELS);
  const data = {
    labels: labels.map(key => DIMENSION_LABELS[key]),
    datasets: [
      {
        label: '评分',
        data: labels.map(key => scores[key] || 0),
        backgroundColor: 'rgba(26, 58, 42, 0.15)',
        borderColor: 'rgba(26, 58, 42, 0.8)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(26, 58, 42, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(26, 58, 42, 1)',
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 10,
        min: 0,
        ticks: {
          stepSize: 2,
          font: { size: 10 },
          backdropColor: 'transparent',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.06)',
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.06)',
        },
        pointLabels: {
          font: { size: 12, family: "'Noto Sans SC', sans-serif" },
          color: '#2d2d2d',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: { raw: unknown }) => `${context.raw} 分`,
        },
      },
    },
  };

  return <Radar data={data} options={options} />;
}

export function MultiRadarChart({ scores }: MultiRadarChartProps) {
  const labels = Object.keys(DIMENSION_LABELS);
  const data = {
    labels: labels.map(key => DIMENSION_LABELS[key]),
    datasets: scores.map((student, index) => {
      const color = COLORS[index % COLORS.length];
      return {
        label: student.name,
        data: labels.map(key => student.scores[key] || 0),
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 2,
        pointBackgroundColor: color.border,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: color.border,
        pointRadius: 3,
      };
    }),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 10,
        min: 0,
        ticks: {
          stepSize: 2,
          font: { size: 10 },
          backdropColor: 'transparent',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.06)',
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.06)',
        },
        pointLabels: {
          font: { size: 12, family: "'Noto Sans SC', sans-serif" },
          color: '#2d2d2d',
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { size: 12, family: "'Noto Sans SC', sans-serif" },
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: { dataset: { label?: string }; raw: unknown }) =>
            `${context.dataset.label}: ${context.raw} 分`,
        },
      },
    },
  };

  return <Radar data={data} options={options} />;
}
