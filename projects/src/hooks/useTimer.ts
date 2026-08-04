'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseTimerReturn {
  /** 当前计时（秒） */
  seconds: number;
  /** 是否正在计时 */
  isRunning: boolean;
  /** 开始计时 */
  start: () => void;
  /** 停止计时 */
  stop: () => void;
  /** 重置计时 */
  reset: () => void;
}

/**
 * 计时器 Hook
 */
export function useTimer(): UseTimerReturn {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const stop = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(0);
  }, []);

  return { seconds, isRunning, start, stop, reset };
}
