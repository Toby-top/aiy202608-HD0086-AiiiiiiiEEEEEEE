'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';

interface CameraPreviewProps {
  isActive: boolean;
}

export default function CameraPreview({ isActive }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) {
      // 停止摄像头
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    // 启动摄像头
    let mounted = true;
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
        });
        if (mounted && videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          streamRef.current = mediaStream;
          setError(null);
        }
      } catch (err) {
        console.error('摄像头启动失败:', err);
        setError('无法访问摄像头');
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isActive]);

  if (!isActive) {
    return (
      <div className="flex h-full items-center justify-center bg-stone-800">
        <CameraOff className="h-12 w-12 text-stone-600" />
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden bg-stone-900">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-900/80">
          <div className="text-center">
            <Camera className="mx-auto h-8 w-8 text-stone-500" />
            <p className="mt-2 text-sm text-stone-400">{error}</p>
          </div>
        </div>
      )}
      {/* 摄像头状态指示器 */}
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
        <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        <span className="text-xs text-white">摄像头开启</span>
      </div>
    </div>
  );
}
