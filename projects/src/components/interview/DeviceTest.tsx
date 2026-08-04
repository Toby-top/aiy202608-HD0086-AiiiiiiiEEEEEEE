'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Mic, MicOff, CameraOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceTestProps {
  onStartInterview: () => void;
  onBack?: () => void;
  interviewTitle: string;
}

export function DeviceTest({ onStartInterview, onBack, interviewTitle }: DeviceTestProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const hasAutoRequestedRef = useRef(false);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [micLoading, setMicLoading] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  const [error, setError] = useState('');

  const closeAudioContext = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      void audioContextRef.current.close().catch(() => undefined);
    }
    audioContextRef.current = null;
  }, []);

  // 获取设备列表
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameraDevices(devices.filter((d) => d.kind === 'videoinput'));
      setMicDevices(devices.filter((d) => d.kind === 'audioinput'));
    } catch (err) {
      console.error('获取设备列表失败:', err);
    }
  }, []);

  // 开启摄像头
  const enableCamera = useCallback(async () => {
    setCameraLoading(true);
    setError('');
    try {
      // 停止之前的流
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setCameraEnabled(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError('无法访问摄像头，请检查权限设置');
      setCameraEnabled(false);
    } finally {
      setCameraLoading(false);
    }
  }, [cameraStream, selectedCamera]);

  // 关闭摄像头
  const disableCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setCameraEnabled(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [cameraStream]);

  // 开启麦克风
  const enableMic = useCallback(async () => {
    setMicLoading(true);
    setError('');
    try {
      // 停止之前的流
      if (audioStream) {
        audioStream.getTracks().forEach((t) => t.stop());
      }
      closeAudioContext();
      cancelAnimationFrame(animationFrameRef.current);

      const constraints: MediaStreamConstraints = {
        audio: selectedMic
          ? {
              autoGainControl: true,
              deviceId: { exact: selectedMic },
              echoCancellation: true,
              noiseSuppression: true,
            }
          : {
              autoGainControl: true,
              echoCancellation: true,
              noiseSuppression: true,
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setAudioStream(stream);
      setMicEnabled(true);

      // 创建音频分析器
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // 开始检测音量
      const updateVolume = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.fftSize);
          analyserRef.current.getByteTimeDomainData(dataArray);
          const sumSquares = dataArray.reduce((sum, value) => {
            const centered = (value - 128) / 128;
            return sum + centered * centered;
          }, 0);
          const rms = Math.sqrt(sumSquares / dataArray.length);
          setMicVolume(Math.min(1, rms * 5));
        }
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch {
      setError('无法访问麦克风，请检查权限设置');
      setMicEnabled(false);
    } finally {
      setMicLoading(false);
    }
  }, [audioStream, closeAudioContext, selectedMic]);

  // 关闭麦克风
  const disableMic = useCallback(() => {
    if (audioStream) {
      audioStream.getTracks().forEach((t) => t.stop());
      setAudioStream(null);
    }
    closeAudioContext();
    cancelAnimationFrame(animationFrameRef.current);
    setMicEnabled(false);
    setMicVolume(0);
  }, [audioStream, closeAudioContext]);

  // 切换摄像头设备
  const handleCameraChange = useCallback(
    (deviceId: string) => {
      setSelectedCamera(deviceId);
      if (cameraEnabled) {
        // 先关闭再重新开启
        if (cameraStream) {
          cameraStream.getTracks().forEach((t) => t.stop());
        }
        setCameraEnabled(false);
        setTimeout(() => enableCamera(), 100);
      }
    },
    [cameraEnabled, cameraStream, enableCamera]
  );

  // 切换麦克风设备
  const handleMicChange = useCallback(
    (deviceId: string) => {
      setSelectedMic(deviceId);
      if (micEnabled) {
        // 先关闭再重新开启
        if (audioStream) {
          audioStream.getTracks().forEach((t) => t.stop());
        }
        closeAudioContext();
        cancelAnimationFrame(animationFrameRef.current);
        setMicEnabled(false);
        setMicVolume(0);
        setTimeout(() => enableMic(), 100);
      }
    },
    [micEnabled, audioStream, closeAudioContext, enableMic]
  );

  // 初始化
  useEffect(() => {
    getDevices();

    return () => {
      // 清理
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      }
      closeAudioContext();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [closeAudioContext, getDevices]);

  useEffect(() => {
    cameraStreamRef.current = cameraStream;
  }, [cameraStream]);

  useEffect(() => {
    audioStreamRef.current = audioStream;
  }, [audioStream]);

  useEffect(() => {
    if (hasAutoRequestedRef.current) return;
    hasAutoRequestedRef.current = true;

    void enableCamera();
    void enableMic();
  }, [enableCamera, enableMic]);

  // 开始面试
  const handleStart = useCallback(() => {
    // 清理设备测试的流
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
    }
    if (audioStream) {
      audioStream.getTracks().forEach((t) => t.stop());
    }
    closeAudioContext();
    cancelAnimationFrame(animationFrameRef.current);

    onStartInterview();
  }, [cameraStream, audioStream, closeAudioContext, onStartInterview]);

  return (
    <div className="flex h-full flex-col">
      {/* 标题 */}
      <div className="border-b border-stone-200 bg-white px-6 py-4">
        <h2 className="text-lg font-semibold text-stone-900">设备测试</h2>
        <p className="mt-1 text-sm text-stone-500">
          {interviewTitle}开始前请测试您的摄像头和麦克风
        </p>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 摄像头测试 */}
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    cameraEnabled ? 'bg-teal-100 text-teal-700' : 'bg-stone-100 text-stone-500'
                  )}
                >
                  {cameraEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-medium text-stone-900">摄像头</h3>
                  <p className="text-sm text-stone-500">
                    {cameraEnabled ? (
                      <span className="text-teal-600">已开启</span>
                    ) : (
                      '正在请求权限，可手动开启'
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={cameraEnabled ? disableCamera : enableCamera}
                disabled={cameraLoading}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  cameraEnabled
                    ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    : 'bg-teal-600 text-white hover:bg-teal-700',
                  cameraLoading && 'opacity-50'
                )}
              >
                {cameraLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : cameraEnabled ? (
                  '关闭'
                ) : (
                  '开启'
                )}
              </button>
            </div>

            {/* 摄像头预览 */}
            <div className="relative aspect-video overflow-hidden rounded-lg bg-stone-100">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn('h-full w-full object-cover', !cameraEnabled && 'hidden')}
              />
              {!cameraEnabled && (
                <div className="flex h-full items-center justify-center">
                  <CameraOff className="h-12 w-12 text-stone-300" />
                </div>
              )}
            </div>

            {/* 摄像头设备选择 */}
            {cameraDevices.length > 1 && (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-stone-700">选择摄像头</label>
                <select
                  value={selectedCamera}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {cameraDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `摄像头 ${cameraDevices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 麦克风测试 */}
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    micEnabled ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'
                  )}
                >
                  {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-medium text-stone-900">麦克风</h3>
                  <p className="text-sm text-stone-500">
                    {micEnabled ? (
                      <span className="text-amber-600">已开启</span>
                    ) : (
                      '正在请求权限，可手动开启'
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={micEnabled ? disableMic : enableMic}
                disabled={micLoading}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  micEnabled
                    ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    : 'bg-amber-600 text-white hover:bg-amber-700',
                  micLoading && 'opacity-50'
                )}
              >
                {micLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : micEnabled ? (
                  '关闭'
                ) : (
                  '开启'
                )}
              </button>
            </div>

            {/* 音量指示器 */}
            <div className="rounded-lg bg-stone-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-stone-700">音量检测</span>
                <span className="text-sm text-stone-500">{Math.round(micVolume * 100)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-stone-200">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-100',
                    micVolume > 0.7 ? 'bg-red-500' : micVolume > 0.4 ? 'bg-amber-500' : 'bg-teal-500'
                  )}
                  style={{ width: `${micVolume * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-stone-500">
                {micEnabled
                  ? micVolume > 0.1
                    ? '麦克风工作正常，请说话测试'
                    : '未检测到声音，请检查麦克风'
                  : '开启麦克风后显示音量'}
              </p>
            </div>

            {/* 麦克风设备选择 */}
            {micDevices.length > 1 && (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-stone-700">选择麦克风</label>
                <select
                  value={selectedMic}
                  onChange={(e) => handleMicChange(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {micDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `麦克风 ${micDevices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 状态汇总 */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <h4 className="mb-3 font-medium text-stone-900">设备状态</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {cameraEnabled ? (
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-stone-400" />
                )}
                <span className="text-sm text-stone-700">摄像头 {cameraEnabled ? '正常' : '未开启'}</span>
              </div>
              <div className="flex items-center gap-2">
                {micEnabled ? (
                  <CheckCircle2 className="h-4 w-4 text-amber-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-stone-400" />
                )}
                <span className="text-sm text-stone-700">麦克风 {micEnabled ? '正常' : '未开启'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="border-t border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                返回
              </button>
            )}
            <p className="text-sm text-stone-500">
              {cameraEnabled && micEnabled ? (
                <span className="text-teal-600">设备测试完成，可以开始面试</span>
              ) : (
                '请开启摄像头和麦克风后开始面试'
              )}
            </p>
          </div>
          <button
            onClick={handleStart}
            className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            开始面试
          </button>
        </div>
      </div>
    </div>
  );
}
