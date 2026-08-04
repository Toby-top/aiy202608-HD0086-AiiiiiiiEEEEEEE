'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/interview-config';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
} from 'lucide-react';

interface AudioPlayerProps {
  /** 音频文件 URL */
  src: string;
  /** 总时长（秒），用于没有 metadata 时的回退 */
  totalDuration?: number;
  /** 当前播放时间变化回调 */
  onTimeUpdate?: (currentTime: number) => void;
  /** 跳转到指定时间 */
  seekTo?: number | null;
  /** 自定义类名 */
  className?: string;
}

const PLAYBACK_RATES = [0.5, 1, 1.5, 2] as const;

export function AudioPlayer({
  src,
  totalDuration,
  onTimeUpdate,
  seekTo,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(totalDuration ?? 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // 同步 seekTo
  useEffect(() => {
    if (seekTo != null && audioRef.current) {
      audioRef.current.currentTime = seekTo;
      setCurrentTime(seekTo);
      if (!isPlaying) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  }, [seekTo]); // eslint-disable-line react-hooks/exhaustive-deps

  // 时间更新
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isDragging) return;
    const t = audio.currentTime;
    setCurrentTime(t);
    onTimeUpdate?.(t);
  }, [isDragging, onTimeUpdate]);

  // 元数据加载
  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration || totalDuration || 0);
    }
  }, [totalDuration]);

  // 播放结束
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, []);

  // 播放/暂停
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // 进度条点击
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = progressRef.current?.getBoundingClientRect();
      if (!rect || !audioRef.current) return;
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = ratio * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
    },
    [duration, onTimeUpdate]
  );

  // 进度条拖动
  const handleProgressMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true);
      handleProgressClick(e);

      const handleMouseMove = (ev: MouseEvent) => {
        const rect = progressRef.current?.getBoundingClientRect();
        if (!rect) return;
        const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
        setCurrentTime(ratio * duration);
      };

      const handleMouseUp = (ev: MouseEvent) => {
        setIsDragging(false);
        const rect = progressRef.current?.getBoundingClientRect();
        if (rect && audioRef.current) {
          const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
          const newTime = ratio * duration;
          audioRef.current.currentTime = newTime;
          setCurrentTime(newTime);
          onTimeUpdate?.(newTime);
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [duration, handleProgressClick, onTimeUpdate]
  );

  // 音量控制
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setIsMuted(v === 0);
    if (audioRef.current) {
      audioRef.current.volume = v;
      audioRef.current.muted = v === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
      setVolume(audio.volume || 1);
    } else {
      audio.muted = true;
      setIsMuted(true);
    }
  }, [isMuted]);

  // 播放速度
  const cyclePlaybackRate = useCallback(() => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate as typeof PLAYBACK_RATES[number]);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    const newRate = PLAYBACK_RATES[nextIndex];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  }, [playbackRate]);

  // 回退 5 秒
  const skipBack = useCallback(() => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, audioRef.current.currentTime - 5);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn('rounded-xl border border-stone-200 bg-white p-4', className)}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* 进度条 */}
      <div
        ref={progressRef}
        className="group relative mb-3 h-2 cursor-pointer rounded-full bg-stone-100"
        onMouseDown={handleProgressMouseDown}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-teal-500 transition-[width] duration-75"
          style={{ width: `${progress}%` }}
        />
        {/* 播放头 */}
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-teal-600 bg-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
          style={{ left: `${progress}%` }}
        />
      </div>

      {/* 控制栏 */}
      <div className="flex items-center gap-3">
        {/* 回退 */}
        <button
          onClick={skipBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
          aria-label="回退 5 秒"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        {/* 播放/暂停 */}
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-white transition-colors hover:bg-teal-800"
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 fill-white" />
          ) : (
            <Play className="h-4 w-4 fill-white pl-0.5" />
          )}
        </button>

        {/* 时间 */}
        <span className="font-mono text-xs text-stone-500">
          {formatTime(Math.floor(currentTime))} / {formatTime(Math.floor(duration))}
        </span>

        <div className="flex-1" />

        {/* 播放速度 */}
        <button
          onClick={cyclePlaybackRate}
          className="rounded-md px-2 py-1 font-mono text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100"
        >
          {playbackRate}x
        </button>

        {/* 音量 */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className="flex h-7 w-7 items-center justify-center rounded text-stone-500 transition-colors hover:text-stone-700"
            aria-label={isMuted ? '取消静音' : '静音'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1 w-16 cursor-pointer accent-teal-600"
            aria-label="音量"
          />
        </div>
      </div>
    </div>
  );
}
