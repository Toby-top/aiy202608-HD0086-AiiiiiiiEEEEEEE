'use client';

import { useState, useRef, useCallback } from 'react';

export type VideoRecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

interface UseVideoRecorderReturn {
  /** 当前录制状态 */
  status: VideoRecordingStatus;
  /** 录制时长（秒） */
  duration: number;
  /** 开始录制 */
  startRecording: () => Promise<void>;
  /** 停止录制，返回录制的视频 Blob */
  stopRecording: () => Promise<Blob | null>;
  /** 取消录制 */
  cancelRecording: () => void;
  /** 视频预览 URL */
  previewUrl: string | null;
}

/**
 * 视频录制 Hook
 * 使用 MediaRecorder API 实现浏览器视频录制功能
 */
export function useVideoRecorder(): UseVideoRecorderReturn {
  const [status, setStatus] = useState<VideoRecordingStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      chunksRef.current = [];
      setDuration(0);

      // 获取视频和音频流
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = stream;

      // 设置 MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setStatus('recording');

      // 启动计时器
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start video recording:', error);
      setStatus('idle');
      cleanup();
    }
  }, [cleanup]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || status !== 'recording') {
      return null;
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setStatus('stopped');
        cleanup();
        resolve(blob);
      };

      mediaRecorder.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    });
  }, [status, cleanup]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
    }
    chunksRef.current = [];
    setStatus('idle');
    setDuration(0);
    cleanup();
  }, [status, cleanup]);

  return {
    status,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    previewUrl,
  };
}
