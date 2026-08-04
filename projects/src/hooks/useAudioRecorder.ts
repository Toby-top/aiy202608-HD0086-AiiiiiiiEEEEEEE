'use client';

import { useState, useRef, useCallback } from 'react';
import type { RecordingStatus } from '@/types/interview';

interface UseAudioRecorderReturn {
  /** 当前录音状态 */
  status: RecordingStatus;
  /** 录音时长（秒） */
  duration: number;
  /** 开始录音 */
  startRecording: () => Promise<void>;
  /** 停止录音，返回录音 Blob */
  stopRecording: () => Promise<Blob | null>;
  /** 取消录音 */
  cancelRecording: () => void;
  /** 音频分析数据（用于可视化） */
  analyserData: Uint8Array | null;
}

/**
 * 音频录音 Hook
 * 使用 Web Audio API 实现浏览器录音功能
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [analyserData, setAnalyserData] = useState<Uint8Array | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  const updateAnalyser = useCallback(function tick() {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(data);
    setAnalyserData(new Uint8Array(data));
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      chunksRef.current = [];
      setDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = stream;

      // 设置音频分析器
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      // 设置 MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
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

      // 启动分析器可视化
      updateAnalyser();
    } catch (err) {
      console.error('Failed to start recording:', err);
      cleanup();
      throw new Error('无法访问麦克风，请检查权限设置');
    }
  }, [cleanup, updateAnalyser]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        cleanup();
        setStatus('idle');
        resolve(null);
        return;
      }

      setStatus('processing');

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        cleanup();
        setStatus('idle');
        setAnalyserData(null);
        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }, [cleanup]);

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    cleanup();
    chunksRef.current = [];
    setStatus('idle');
    setDuration(0);
    setAnalyserData(null);
  }, [cleanup]);

  return {
    status,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    analyserData,
  };
}
