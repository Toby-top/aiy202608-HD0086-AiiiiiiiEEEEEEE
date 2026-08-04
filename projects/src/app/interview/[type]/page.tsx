'use client';

/**
 * 动态面试页：按面试类型呈现实时语音对话、摄像头预览、录制与结束面试流程。
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import type { InterviewType, ChatMessage, InterviewStatus, InterviewSegment } from '@/types/interview';
import { getInterviewConfig, getOpeningMessage, generateId } from '@/lib/interview-config';
import { useTimer } from '@/hooks/useTimer';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useVideoRecorder } from '@/hooks/useVideoRecorder';
import { VoiceMessage } from '@/components/interview/VoiceMessage';
import { TimerDisplay } from '@/components/interview/TimerDisplay';
import { RecordButton } from '@/components/interview/RecordButton';
import CameraPreview from '@/components/interview/CameraPreview';
import { Sidebar } from '@/components/interview/Sidebar';
import {
  ArrowLeft,
  Flag,
  Mic,
  User,
  Bot,
  Lightbulb,
  Clock,
  MessageSquare,
} from 'lucide-react';

interface InterviewHistoryItem {
  id: string;
  interviewType: InterviewType;
  title: string;
  duration: number;
  createdAt: number;
}

function saveInterviewHistory(item: InterviewHistoryItem) {
  try {
    const raw = localStorage.getItem('interview-history');
    const history = raw ? (JSON.parse(raw) as InterviewHistoryItem[]) : [];
    const next = [item, ...history.filter((saved) => saved.id !== item.id)].slice(0, 20);
    localStorage.setItem('interview-history', JSON.stringify(next));
  } catch {
    // localStorage can fail in private browsing or when quota is exceeded.
  }
}

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const urlType = params.type as InterviewType;
  const searchParams = useSearchParams();
  const isReady = searchParams.get('ready') === 'true';

  const [selectedType, setSelectedType] = useState<InterviewType | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<InterviewStatus>('idle');
  const [isTyping, setIsTyping] = useState(false);
  const [isAITalking, setIsAITalking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const lastAutoPlayedIdRef = useRef<string | null>(null);

  const segmentsRef = useRef<InterviewSegment[]>([]);
  const questionCountRef = useRef(0);

  const timer = useTimer();
  const recorder = useAudioRecorder();
  const videoRecorder = useVideoRecorder();

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const synthesizeSpeech = useCallback(async (text: string) => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      return data.data?.audioUri || data.audioUri || undefined;
    } catch {
      return undefined;
    }
  }, []);

  // 设备测试完成后开始面试
  const handleStartInterview = useCallback(
    async (type: InterviewType) => {
      // 防止重复调用
      if (status !== 'idle') return;

      const config = getInterviewConfig(type);
      if (!config) return;

      const openingText = getOpeningMessage(type);
      const audioUrl = await synthesizeSpeech(openingText);
      questionCountRef.current = 1;
      const openingMessage: ChatMessage = {
        id: generateId(),
        role: 'interviewer',
        content: openingText,
        timestamp: Date.now(),
        audioUrl,
        duration: Math.max(5, openingText.length * 0.06),
      };

      setMessages([openingMessage]);
      setStatus('in-progress');
      timer.start();

      // 启动视频录制
      void videoRecorder.startRecording();

      segmentsRef.current = [
        {
          id: 'seg-opening',
          type: 'opening',
          role: 'interviewer',
          content: openingMessage.content,
          startTime: 0,
          endTime: 0,
          annotations: [],
        },
      ];
    },
    [synthesizeSpeech, timer, status, videoRecorder]
  );

  // 如果 URL 中有 type，自动选中
  useEffect(() => {
    if (urlType && getInterviewConfig(urlType)) {
      setSelectedType(urlType);
      handleStartInterview(urlType);
    }
  }, [urlType, isReady, handleStartInterview]);

  // 选择面试类型后显示设备测试
  // 新对话 - 回到选择界面
  const handleNewChat = useCallback(() => {
    setSelectedType(null);
    setMessages([]);
    segmentsRef.current = [];
    questionCountRef.current = 0;
    setStatus('idle');
    timer.reset();
    router.replace('/interview');
  }, [router, timer]);

  // 自动滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 处理录音结束
  const handleStopRecording = useCallback(async () => {
    if (!selectedType) return;
    const blob = await recorder.stopRecording();
    if (!blob || blob.size === 0) return;

    const studentStartTime = timer.seconds;
    const audioUrl = URL.createObjectURL(blob);
    const audioDuration = recorder.duration;

    const studentMsgId = generateId();
    const studentMessage: ChatMessage = {
      id: studentMsgId,
      role: 'student',
      content: '',
      timestamp: Date.now(),
      audioUrl,
      duration: audioDuration,
    };
    setMessages((prev) => [...prev, studentMessage]);

    const studentEndTime = timer.seconds;
    const answerSegmentId = `seg-answer-${Date.now()}`;
    segmentsRef.current.push({
      id: answerSegmentId,
      type: 'answer',
      role: 'student',
      content: '[语音消息]',
      startTime: studentStartTime,
      endTime: studentEndTime,
      questionIndex: questionCountRef.current || undefined,
      annotations: [],
    });

    // 后台调用 ASR 转文字
    setIsTyping(true);
    let recognizedText = '';
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const asrResponse = await fetch('/api/asr', {
        method: 'POST',
        body: formData,
      });

      const asrData = (await asrResponse.json()) as import('@/types/interview').ASRResponse;

      const text = asrData.data?.text || asrData.text;
      if (asrData.success && text?.trim()) {
        recognizedText = text.trim();
      } else {
        recognizedText = '(未检测到有效语音)';
      }
    } catch {
      recognizedText = '(语音识别暂不可用)';
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === studentMsgId ? { ...msg, content: recognizedText } : msg
      )
    );
    segmentsRef.current = segmentsRef.current.map((segment) =>
      segment.id === answerSegmentId
        ? { ...segment, content: recognizedText || '(未检测到有效语音)' }
        : segment
    );

    // 将识别文字发送给 AI 面试官。ASR 失败时保留用户气泡，但不把占位文本交给模型胡编。
    const messageForAI = recognizedText.startsWith('(')
      ? 'The student audio could not be transcribed clearly. Please ask them to repeat the answer in a friendly, concise way.'
      : recognizedText;

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewType: selectedType,
          message: messageForAI,
          history: [
            ...messagesRef.current,
            { ...studentMessage, content: recognizedText },
          ],
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // 解析 UI_CMD 数据
        const uiCmd = data.data.uiCmd;
        const replyText = uiCmd ? uiCmd.chat_bubble : data.data.reply;
        const audioUrl = await synthesizeSpeech(replyText);

        const aiMessage: ChatMessage = {
          id: data.data.messageId,
          role: 'interviewer',
          content: replyText,
          timestamp: Date.now(),
          audioUrl,
          duration: Math.max(3, replyText.length * 0.06),
          subtitle: uiCmd?.subtitle_text,
          stage: uiCmd?.current_stage,
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsAITalking(true);
        // 预计 TTS 播放时间后停止
        setTimeout(() => setIsAITalking(false), (aiMessage.duration || 5) * 1000 + 500);

        questionCountRef.current += 1;
        segmentsRef.current.push({
          id: `seg-question-${Date.now()}`,
          type: 'question',
          role: 'interviewer',
          content: replyText,
          startTime: studentEndTime,
          endTime: timer.seconds,
          questionIndex: questionCountRef.current,
          annotations: [],
        });
      }
    } catch {
      const fallbackReplies = [
        'Great answer! Let me ask you another question. What do you think is the biggest challenge in your learning journey? How did you overcome it?',
        "Thank you for sharing. Now I'd like to know about your extracurricular activities. Which one has influenced you the most?",
        'Interesting perspective. Can you describe a time when you faced a difficult situation? What did you learn from that experience?',
        'Your response shows great depth. If you could choose any subject to study in depth, what would it be and why?',
      ];
      const randomReply =
        fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'interviewer',
        content: randomReply,
        timestamp: Date.now(),
        audioUrl: await synthesizeSpeech(randomReply),
        duration: Math.max(3, randomReply.length * 0.06),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsAITalking(true);
      setTimeout(() => setIsAITalking(false), (aiMessage.duration || 5) * 1000 + 500);

      questionCountRef.current += 1;
      segmentsRef.current.push({
        id: `seg-question-${Date.now()}`,
        type: 'question',
        role: 'interviewer',
        content: randomReply,
        startTime: studentEndTime,
        endTime: timer.seconds,
        questionIndex: questionCountRef.current,
        annotations: [],
      });
    } finally {
      setIsTyping(false);
    }
  }, [recorder, selectedType, synthesizeSpeech, timer]);

  // 结束面试
  const handleFinish = useCallback(async () => {
    if (!selectedType) return;
    setStatus('finishing');
    timer.stop();

    // 停止视频录制
    const videoBlob = await videoRecorder.stopRecording();

    const systemMessage: ChatMessage = {
      id: generateId(),
      role: 'system',
      content: '面试已结束',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, systemMessage]);

    const segments = segmentsRef.current;
    if (segments.length > 0 && segments[0].endTime === 0) {
      segments[0].endTime = segments.length > 1 ? segments[1].startTime : timer.seconds;
    }

    segments.push({
      id: 'seg-closing',
      type: 'closing',
      role: 'system',
      content: '面试已结束，感谢你的参与。',
      startTime: timer.seconds,
      endTime: timer.seconds,
      annotations: [],
    });

    const resultId = generateId();
    try {
      // 将视频 Blob 转换为 base64 以便存储
      let videoDataUrl = '';
      if (videoBlob && videoBlob.size <= 3_500_000) {
        videoDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(videoBlob);
        });
      }

      const playbackData = {
        id: resultId,
        interviewType: selectedType,
        audioUrl: '/mock-interview.webm',
        videoUrl: videoDataUrl,
        messages: messagesRef.current,
        totalDuration: timer.seconds,
        segments,
        createdAt: Date.now(),
      };
      try {
        localStorage.setItem(`interview-${resultId}`, JSON.stringify(playbackData));
      } catch {
        localStorage.setItem(
          `interview-${resultId}`,
          JSON.stringify({ ...playbackData, videoUrl: '' })
        );
      }
      saveInterviewHistory({
        id: resultId,
        interviewType: selectedType,
        title: getInterviewConfig(selectedType)?.title || '模拟面试',
        duration: timer.seconds,
        createdAt: playbackData.createdAt,
      });
    } catch {
      // localStorage 不可用时静默失败
    }

    setTimeout(() => {
      router.push(`/result/${resultId}?type=${selectedType}&duration=${timer.seconds}`);
    }, 1000);
  }, [router, selectedType, timer, videoRecorder]);

  const config = selectedType ? getInterviewConfig(selectedType) : null;
  const latestMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    const latest = messages[messages.length - 1];
    if (!latest || latest.role !== 'interviewer' || latest.id === lastAutoPlayedIdRef.current) {
      return;
    }

    lastAutoPlayedIdRef.current = latest.id;
    setIsAITalking(true);
    const timeout = window.setTimeout(
      () => setIsAITalking(false),
      Math.max(3, latest.duration || 3) * 1000 + 500
    );

    return () => window.clearTimeout(timeout);
  }, [messages]);

  return (
    <div className="flex h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar
          interviewType={selectedType || ''}
          messageCount={messages.filter((m) => m.role === 'student').length}
          duration={timer.seconds}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Main Content */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="relative z-20 border-b border-stone-200/60 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={selectedType ? handleNewChat : () => router.push('/interviews')}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 transition-all hover:bg-stone-100 hover:text-stone-700"
                aria-label={selectedType ? '返回面试选择' : '返回首页'}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-sm">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-stone-900">
                    {selectedType ? config?.title : 'AI 面试辅导'}
                  </h1>
                  {selectedType && (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                        {status === 'in-progress' ? '面试中' : '准备中'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {selectedType && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-xl bg-stone-100/80 px-3 py-1.5">
                  <Clock className="h-3.5 w-3.5 text-stone-500" />
                  <TimerDisplay seconds={timer.seconds} />
                </div>
                <button
                  onClick={handleFinish}
                  disabled={status !== 'in-progress'}
                  className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-all hover:bg-red-100 disabled:opacity-40 disabled:hover:bg-red-50"
                >
                  <Flag className="h-3.5 w-3.5" />
                  结束
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        {!selectedType ? (
          /* ===== 欢迎界面 ===== */
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-semibold text-stone-900">
                欢迎使用 AI 面试辅导
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                点击左侧「新对话」开始模拟面试
              </p>
            </div>
          </div>
        ) : (
          /* ===== 对话界面 ===== */
          <>
            {/* Initialview 左右分屏布局 */}
            {selectedType === 'initialview' && status === 'in-progress' && (
              <div className="absolute inset-0 z-0 flex items-center justify-center p-6">
                <div className="flex w-full max-w-6xl gap-6" style={{ aspectRatio: '16/10', maxHeight: '80vh' }}>
                  {/* 左半部分：AI 面试官 */}
                  <div className="flex-1 relative bg-gradient-to-br from-stone-100 to-stone-200 rounded-2xl overflow-hidden shadow-xl">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-full h-full flex items-center justify-center p-8">
                        <Image
                          src="/interviewer.png"
                          alt="AI 面试官"
                          width={400}
                          height={400}
                          className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                        />
                        {/* 说话时的动画效果 */}
                        {isAITalking && (
                          <div className="absolute inset-0 rounded-xl ring-4 ring-teal-400/50 animate-pulse" />
                        )}
                      </div>
                    </div>
                    {/* 面试官标签 */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                          <span className="text-sm font-medium text-stone-700">AI 面试官</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* 右半部分：用户摄像头 */}
                  <div className="flex-1 relative rounded-2xl overflow-hidden shadow-xl">
                    <CameraPreview isActive={true} />
                    {/* 用户标签 */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500" />
                          <span className="text-sm font-medium text-stone-700">我</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Area */}
            <div className={`flex-1 overflow-y-auto relative z-10 ${selectedType === 'initialview' ? 'bg-transparent' : ''}`}>
              <div className={`mx-auto max-w-3xl px-4 py-6 sm:px-6 ${selectedType === 'initialview' ? '' : ''}`}>
                {/* Welcome Card - 仅非 Initialview 显示 */}
                {selectedType !== 'initialview' && (
                  <div className="mb-6 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50/80 to-amber-50/40 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-800">面试小贴士</p>
                        <p className="mt-1 text-xs leading-relaxed text-stone-600">{config?.tips}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="space-y-5">
                  {messages.map((message) => {
                    if (message.role === 'system') {
                      return (
                        <div key={message.id} className="flex justify-center py-3">
                          <span className={`rounded-full px-4 py-1.5 text-xs shadow-sm ${
                            selectedType === 'initialview'
                              ? 'bg-white/40 backdrop-blur-sm text-stone-600 border border-white/50'
                              : 'bg-stone-100 text-stone-500'
                          }`}>
                            {message.content}
                          </span>
                        </div>
                      );
                    }

                    if (message.role === 'interviewer') {
                      return (
                        <div
                          key={message.id}
                          className="flex animate-[slide-up_0.3s_ease-out] gap-3"
                        >
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                            selectedType === 'initialview'
                              ? 'bg-white/40 backdrop-blur-sm text-teal-700 border border-white/50'
                              : 'bg-gradient-to-br from-teal-500 to-teal-600 text-white'
                          }`}>
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`mb-1.5 text-xs font-medium ${
                              selectedType === 'initialview' ? 'text-stone-700' : 'text-stone-500'
                            }`}>面试官</p>
                          <VoiceMessage
                            audioUrl={message.audioUrl}
                            duration={message.duration || 3}
                            role="interviewer"
                            textContent={message.content}
                            variant={selectedType === 'initialview' ? 'glass' : 'default'}
                            autoPlay={latestMessageId === message.id}
                          />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={message.id}
                        className="flex animate-[slide-up_0.3s_ease-out] gap-3 flex-row-reverse"
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                          selectedType === 'initialview'
                            ? 'bg-white/40 backdrop-blur-sm text-amber-700 border border-white/50'
                            : 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
                        }`}>
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col items-end">
                          <p className={`mb-1.5 text-xs font-medium ${
                            selectedType === 'initialview' ? 'text-stone-700' : 'text-stone-500'
                          }`}>我</p>
                          <VoiceMessage
                            audioUrl={message.audioUrl}
                            duration={message.duration || 3}
                            role="student"
                            textContent={message.content}
                            variant={selectedType === 'initialview' ? 'glass' : 'default'}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {isTyping && (
                    <div className="flex animate-[slide-up_0.3s_ease-out] gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                        selectedType === 'initialview'
                          ? 'bg-white/40 backdrop-blur-sm text-teal-700 border border-white/50'
                          : 'bg-gradient-to-br from-teal-500 to-teal-600 text-white'
                      }`}>
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`mb-1.5 text-xs font-medium ${
                          selectedType === 'initialview' ? 'text-stone-700' : 'text-stone-500'
                        }`}>面试官</p>
                        <div className={`inline-flex items-center gap-2 rounded-2xl rounded-tl-md px-4 py-3 ${
                          selectedType === 'initialview'
                            ? 'bg-white/40 backdrop-blur-sm border border-white/50'
                            : 'bg-teal-50'
                        }`}>
                          <div className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0ms]" />
                            <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:150ms]" />
                            <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:300ms]" />
                          </div>
                          <span className={`text-sm ${
                            selectedType === 'initialview' ? 'text-stone-700' : 'text-teal-600'
                          }`}>正在思考...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className={`relative z-10 border-t px-4 py-5 sm:px-6 ${
              selectedType === 'initialview'
                ? 'border-stone-200/30 bg-white/20 backdrop-blur-md'
                : 'border-stone-200/60 bg-white/80 backdrop-blur-sm'
            }`}>
              {/* Subtitle Display */}
              {isAITalking && messages.length > 0 && messages[messages.length - 1].role === 'interviewer' && messages[messages.length - 1].subtitle && (
                <div className="mb-4 mx-auto max-w-2xl">
                  <div className={`rounded-xl px-4 py-3 text-center ${
                    selectedType === 'initialview'
                      ? 'bg-black/40 backdrop-blur-sm text-white'
                      : 'bg-stone-800 text-white'
                  }`}>
                    <p className="text-sm leading-relaxed">{messages[messages.length - 1].subtitle}</p>
                  </div>
                </div>
              )}

              <div className="mx-auto max-w-md flex flex-col items-center gap-3">
                <RecordButton
                  status={recorder.status}
                  duration={recorder.duration}
                  onStart={() => recorder.startRecording()}
                  onStop={handleStopRecording}
                  analyserData={recorder.analyserData}
                />
                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <Mic className="h-3.5 w-3.5" />
                  <span>
                    {recorder.status === 'recording'
                      ? '松开结束录音'
                      : '按住说话，松开后发送语音'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
