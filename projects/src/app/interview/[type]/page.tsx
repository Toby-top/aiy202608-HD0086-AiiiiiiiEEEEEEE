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
  MicOff,
  User,
  Bot,
  Lightbulb,
  Clock,
  MessageSquare,
  GraduationCap,
  Users,
  Video,
  VideoOff,
  Captions,
  FileText,
  Globe,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface InterviewHistoryItem {
  id: string;
  interviewType: InterviewType;
  title: string;
  duration: number;
  createdAt: number;
}

interface ActiveInterviewSession {
  interviewType: InterviewType;
  messages: ChatMessage[];
  segments: InterviewSegment[];
  questionCount: number;
  aiMinutes: string[];
  currentStage: NonNullable<ChatMessage['stage']>;
  hostName: string;
  languageMode: 'en' | 'zh';
  savedAt: number;
}

interface BrowserSpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface BrowserSpeechRecognitionErrorEvent extends Event {
  error?: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface BrowserSpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition;
}

type SpeechWindow = Window & {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
};

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

function getActiveSessionKey(type: InterviewType) {
  return `active-interview-session-${type}`;
}

const STAGE_NAMES: Record<NonNullable<ChatMessage['stage']>, string> = {
  ice_breaking: '破冰',
  academics: '学术',
  critical_thinking: '思辨',
  wrap_up: '收尾',
};

const STAGE_ORDER: NonNullable<ChatMessage['stage']>[] = [
  'ice_breaking',
  'academics',
  'critical_thinking',
  'wrap_up',
];

const TYPE_ICONS: Record<InterviewType, typeof GraduationCap> = {
  'common-app': GraduationCap,
  alumni: Users,
  initialview: Video,
};

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
  const [hostName, setHostName] = useState('AI 面试官');
  const [aiMinutes, setAiMinutes] = useState<string[]>([]);
  const [languageMode, setLanguageMode] = useState<'en' | 'zh'>('en');
  const [currentStage, setCurrentStage] = useState<NonNullable<ChatMessage['stage']>>('ice_breaking');
  const [showAiMinutes, setShowAiMinutes] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const lastAutoPlayedIdRef = useRef<string | null>(null);
  const hasStartedInterviewRef = useRef(false);
  const browserRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const browserRecognitionActiveRef = useRef(false);
  const browserTranscriptRef = useRef('');

  const segmentsRef = useRef<InterviewSegment[]>([]);
  const questionCountRef = useRef(0);

  const timer = useTimer();
  const recorder = useAudioRecorder();
  const videoRecorder = useVideoRecorder();
  const startTimer = timer.start;
  const resetTimer = timer.reset;
  const startVideoRecording = videoRecorder.startRecording;

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

  const stopBrowserSpeechRecognition = useCallback(() => {
    browserRecognitionActiveRef.current = false;
    const recognition = browserRecognitionRef.current;
    if (!recognition) return;

    recognition.onend = null;
    recognition.onresult = null;
    recognition.onerror = null;
    try {
      recognition.stop();
    } catch {
      recognition.abort();
    }
    browserRecognitionRef.current = null;
  }, []);

  const startBrowserSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;

    const speechWindow = window as SpeechWindow;
    const Recognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      browserTranscriptRef.current = '';
      return;
    }

    stopBrowserSpeechRecognition();
    browserTranscriptRef.current = '';
    browserRecognitionActiveRef.current = true;

    const startRecognition = () => {
      if (!browserRecognitionActiveRef.current) return;

      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript || '')
          .join(' ')
          .trim();
        if (transcript) {
          browserTranscriptRef.current = transcript;
        }
      };
      recognition.onerror = (event) => {
        console.warn('Browser speech recognition error:', event.error);
      };
      recognition.onend = () => {
        browserRecognitionRef.current = null;
        if (browserRecognitionActiveRef.current) {
          window.setTimeout(startRecognition, 250);
        }
      };

      try {
        recognition.start();
        browserRecognitionRef.current = recognition;
      } catch {
        browserRecognitionRef.current = null;
      }
    };

    startRecognition();
  }, [stopBrowserSpeechRecognition]);

  useEffect(() => stopBrowserSpeechRecognition, [stopBrowserSpeechRecognition]);

  // 设备测试完成后开始面试
  const handleStartInterview = useCallback(
    (type: InterviewType) => {
      // 防止重复调用
      if (hasStartedInterviewRef.current || status !== 'idle') return;

      const config = getInterviewConfig(type);
      if (!config) return;
      hasStartedInterviewRef.current = true;

      const openingText = getOpeningMessage(type);
      questionCountRef.current = 1;
      setHostName(type === 'alumni' ? '校友面试官' : 'AI 面试官');
      setLanguageMode(type === 'initialview' ? 'en' : 'zh');
      setCurrentStage('ice_breaking');
      setAiMinutes([`${config.title} 已开始，当前阶段：${STAGE_NAMES.ice_breaking}。`]);
      setWaitingForAnswer(false);
      const openingMessage: ChatMessage = {
        id: generateId(),
        role: 'interviewer',
        content: openingText,
        timestamp: Date.now(),
        duration: Math.max(5, openingText.length * 0.06),
        subtitle: openingText,
        stage: 'ice_breaking',
      };

      setMessages([openingMessage]);
      setStatus('in-progress');
      startTimer();

      // 启动视频录制
      void startVideoRecording();

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

      void synthesizeSpeech(openingText).then((audioUrl) => {
        if (!audioUrl) return;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === openingMessage.id ? { ...message, audioUrl } : message
          )
        );
      });
      window.setTimeout(
        () => setWaitingForAnswer(true),
        Math.max(5, openingText.length * 0.06) * 1000 + 500
      );
    },
    [synthesizeSpeech, startTimer, status, startVideoRecording]
  );

  // 如果 URL 中有 type，自动选中
  useEffect(() => {
    if (urlType && getInterviewConfig(urlType)) {
      setSelectedType(urlType);
      try {
        const raw = sessionStorage.getItem(getActiveSessionKey(urlType));
        const saved = raw ? (JSON.parse(raw) as ActiveInterviewSession) : null;
        const isFresh = saved && Date.now() - saved.savedAt < 2 * 60 * 60 * 1000;
        if (saved?.interviewType === urlType && isFresh && saved.messages.length > 0) {
          hasStartedInterviewRef.current = true;
          setMessages(saved.messages);
          messagesRef.current = saved.messages;
          segmentsRef.current = saved.segments;
          questionCountRef.current = saved.questionCount;
          setAiMinutes(saved.aiMinutes);
          setCurrentStage(saved.currentStage);
          setHostName(saved.hostName);
          setLanguageMode(saved.languageMode);
          setStatus('in-progress');
          startTimer();
          return;
        }
      } catch {
        // sessionStorage can be unavailable or contain older data.
      }
      handleStartInterview(urlType);
    }
  }, [urlType, isReady, handleStartInterview, startTimer]);

  useEffect(() => {
    if (!selectedType || status !== 'in-progress' || messages.length === 0) return;

    const session: ActiveInterviewSession = {
      interviewType: selectedType,
      messages,
      segments: segmentsRef.current,
      questionCount: questionCountRef.current,
      aiMinutes,
      currentStage,
      hostName,
      languageMode,
      savedAt: Date.now(),
    };

    try {
      sessionStorage.setItem(getActiveSessionKey(selectedType), JSON.stringify(session));
    } catch {
      // Ignore storage failures during long interviews.
    }
  }, [aiMinutes, currentStage, hostName, languageMode, messages, selectedType, status]);

  // 选择面试类型后显示设备测试
  // 新对话 - 回到选择界面
  const handleNewChat = useCallback(() => {
    setSelectedType(null);
    setMessages([]);
    setAiMinutes([]);
    setShowAiMinutes(false);
    setShowChatPanel(false);
    setWaitingForAnswer(false);
    setSidebarOpen(false);
    segmentsRef.current = [];
    questionCountRef.current = 0;
    setStatus('idle');
    hasStartedInterviewRef.current = false;
    if (selectedType) {
      try {
        sessionStorage.removeItem(getActiveSessionKey(selectedType));
      } catch {
        // Ignore storage failures when leaving the interview.
      }
    }
    resetTimer();
    router.replace('/interview');
  }, [router, resetTimer, selectedType]);

  // 自动滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 处理录音结束
  const handleStopRecording = useCallback(async () => {
    if (!selectedType) return;
    stopBrowserSpeechRecognition();
    const blob = await recorder.stopRecording();
    setWaitingForAnswer(false);
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
    let asrErrorText = '';
    try {
      const formData = new FormData();
      const extension = blob.type.includes('ogg')
        ? 'ogg'
        : blob.type.includes('mp4')
          ? 'm4a'
          : 'webm';
      formData.append('audio', blob, `recording.${extension}`);

      const asrResponse = await fetch('/api/asr', {
        method: 'POST',
        body: formData,
      });

      const asrData = (await asrResponse.json()) as import('@/types/interview').ASRResponse;

      const text = asrData.data?.text || asrData.text;
      if (asrData.success && text?.trim()) {
        recognizedText = text.trim();
      } else {
        const detail = asrData.error || asrData.message || '未检测到有效语音';
        const debug = asrData.debug?.type
          ? `，格式：${asrData.debug.type}，大小：${asrData.debug.size ?? 0} bytes`
          : '';
        asrErrorText = `${detail}${debug}`;
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : '语音识别暂不可用';
      asrErrorText = detail;
    }

    const browserTranscript = browserTranscriptRef.current.trim();
    if (!recognizedText && browserTranscript) {
      recognizedText = browserTranscript;
    }
    if (!recognizedText) {
      recognizedText = `(${asrErrorText || '未检测到有效语音；如果你用的是 Firefox，请换 Chrome/Safari 或配置服务端 ASR'})`;
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
        if (uiCmd) {
          setHostName(uiCmd.speaker_name || 'AI 面试官');
          setCurrentStage(uiCmd.current_stage || 'ice_breaking');
          setLanguageMode(/[\u4e00-\u9fa5]/.test(uiCmd.chat_bubble || uiCmd.speech_text) ? 'zh' : 'en');
        }
        setAiMinutes((prev) => [
          ...prev,
          `学生：${recognizedText}`,
          `面试官：${replyText}`,
        ].slice(-12));
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
        setTimeout(() => {
          setIsAITalking(false);
          if (uiCmd?.action !== 'end') {
            setWaitingForAnswer(true);
          }
        }, (aiMessage.duration || 5) * 1000 + 500);

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
      setAiMinutes((prev) => [
        ...prev,
        `学生：${recognizedText}`,
        `面试官：${randomReply}`,
      ].slice(-12));
      setTimeout(() => {
        setIsAITalking(false);
        setWaitingForAnswer(true);
      }, (aiMessage.duration || 5) * 1000 + 500);

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
  }, [recorder, selectedType, stopBrowserSpeechRecognition, synthesizeSpeech, timer]);

  // 结束面试
  const handleFinish = useCallback(async () => {
    if (!selectedType) return;
    setStatus('finishing');
    hasStartedInterviewRef.current = false;
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
      sessionStorage.removeItem(getActiveSessionKey(selectedType));
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

  const activeStageIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="flex h-screen bg-gradient-to-b from-stone-50 to-white">
      <button
        onClick={() => setSidebarOpen((value) => !value)}
        className="fixed left-3 top-3 z-50 inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-lg transition-all hover:bg-stone-50 lg:hidden"
        aria-label={sidebarOpen ? '关闭侧边栏' : '打开侧边栏'}
      >
        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        <span>菜单</span>
      </button>

      {/* Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar
          interviewType={selectedType || ''}
          messageCount={messages.filter((m) => m.role === 'student').length}
          duration={timer.seconds}
          onNewChat={handleNewChat}
        />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
            aria-label="关闭侧边栏遮罩"
          />
          <div className="absolute inset-y-0 left-0">
            <Sidebar
              interviewType={selectedType || ''}
              messageCount={messages.filter((m) => m.role === 'student').length}
              duration={timer.seconds}
              onNewChat={handleNewChat}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="relative z-20 border-b border-stone-200/60 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={selectedType ? handleNewChat : () => router.push('/interviews')}
                className="ml-24 flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 transition-all hover:bg-stone-100 hover:text-stone-700 sm:ml-28 lg:ml-0"
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
                <div className="hidden items-center gap-1 rounded-xl bg-stone-100/80 px-3 py-1.5 sm:flex">
                  {STAGE_ORDER.map((stage, index) => (
                    <div key={stage} className="flex items-center">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${
                          stage === currentStage
                            ? 'bg-teal-500 text-white'
                            : activeStageIndex > index
                              ? 'bg-teal-200 text-teal-700'
                              : 'bg-stone-200 text-stone-400'
                        }`}
                        title={STAGE_NAMES[stage]}
                      >
                        {index + 1}
                      </div>
                      {index < STAGE_ORDER.length - 1 && (
                        <div
                          className={`mx-0.5 h-0.5 w-3 ${
                            activeStageIndex > index ? 'bg-teal-300' : 'bg-stone-200'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowAiMinutes((value) => !value)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    showAiMinutes
                      ? 'bg-teal-50 text-teal-700'
                      : 'bg-stone-100/80 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">纪要</span>
                </button>
                <button
                  onClick={() => setShowChatPanel((value) => !value)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    showChatPanel
                      ? 'bg-teal-50 text-teal-700'
                      : 'bg-stone-100/80 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">聊天</span>
                </button>
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
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {Object.entries(TYPE_ICONS).map(([type, Icon]) => (
                  <button
                    key={type}
                    onClick={() => router.push(`/interview/${type}`)}
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-sm transition-all hover:border-teal-200 hover:text-teal-700"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {getInterviewConfig(type as InterviewType)?.title}
                  </button>
                ))}
              </div>
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
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                            <span className="truncate text-sm font-medium text-stone-700">{hostName}</span>
                          </div>
                          <div className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5">
                            <Globe className="h-3 w-3 text-stone-500" />
                            <span className="text-xs font-medium text-stone-600">
                              {languageMode === 'en' ? '英' : '中'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* 右半部分：用户摄像头 */}
                  <div className="flex-1 relative rounded-2xl overflow-hidden shadow-xl">
                    {isVideoOff ? (
                      <div className="flex h-full min-h-[320px] items-center justify-center bg-stone-900 text-white">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-800">
                            <VideoOff className="h-7 w-7" />
                          </div>
                          <span className="text-sm text-stone-300">摄像头已关闭</span>
                        </div>
                      </div>
                    ) : (
                      <CameraPreview isActive={true} />
                    )}
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

            {/* 腾讯会议风格底部控制栏 */}
            <div className="relative z-10 border-t border-stone-200/60 bg-white/90 backdrop-blur-md">
              {/* Subtitle Display */}
              {showSubtitles && isAITalking && messages.length > 0 && messages[messages.length - 1].role === 'interviewer' && messages[messages.length - 1].subtitle && (
                <div className="mx-auto max-w-2xl px-4 pt-3">
                  <div className={`rounded-xl px-4 py-3 text-center ${
                    selectedType === 'initialview'
                      ? 'bg-black/40 backdrop-blur-sm text-white'
                      : 'bg-stone-800 text-white'
                  }`}>
                    <p className="text-sm leading-relaxed">{messages[messages.length - 1].subtitle}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center gap-3 px-4 py-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
                <div className="flex min-w-0 justify-center lg:justify-start">
                  <span
                    className={`rounded-full px-3 py-2 text-xs font-medium ${
                      recorder.status === 'recording'
                        ? 'bg-red-50 text-red-600'
                        : waitingForAnswer
                          ? 'bg-teal-50 text-teal-700'
                          : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {recorder.status === 'recording'
                      ? '正在录音，说完后点击停止'
                      : waitingForAnswer
                        ? '请开始回答'
                        : '等待面试官提问'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => setIsMuted((value) => !value)}
                    className="flex min-w-[62px] flex-col items-center gap-1 rounded-lg px-3 py-2 text-stone-600 transition-all hover:bg-stone-100"
                    title={isMuted ? '解除静音' : '静音'}
                  >
                    {isMuted ? (
                      <MicOff className="h-5 w-5 text-red-500" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                    <span className="text-[10px]">{isMuted ? '解除静音' : '静音'}</span>
                  </button>
                  <div className="px-2">
                    <RecordButton
                      status={recorder.status}
                      duration={recorder.duration}
                      onStart={async () => {
                        if (!isMuted) {
                          await recorder.startRecording();
                          startBrowserSpeechRecognition();
                        }
                      }}
                      onStop={handleStopRecording}
                      analyserData={recorder.analyserData}
                    />
                  </div>
                  <button
                    onClick={() => setIsVideoOff((value) => !value)}
                    className="flex min-w-[62px] flex-col items-center gap-1 rounded-lg px-3 py-2 text-stone-600 transition-all hover:bg-stone-100"
                    title={isVideoOff ? '开启视频' : '停止视频'}
                  >
                    {isVideoOff ? (
                      <VideoOff className="h-5 w-5 text-red-500" />
                    ) : (
                      <Video className="h-5 w-5" />
                    )}
                    <span className="text-[10px]">{isVideoOff ? '开视频' : '关视频'}</span>
                  </button>
                  <button
                    onClick={() => setShowSubtitles((value) => !value)}
                    className={`flex min-w-[62px] flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-stone-100 ${
                      showSubtitles ? 'bg-teal-50 text-teal-600' : 'text-stone-600'
                    }`}
                    title={showSubtitles ? '关闭字幕' : '开启字幕'}
                  >
                    <Captions className="h-5 w-5" />
                    <span className="text-[10px]">{showSubtitles ? '关字幕' : '字幕'}</span>
                  </button>
                  <button
                    onClick={() => setShowChatPanel((value) => !value)}
                    className={`flex min-w-[62px] flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-stone-100 ${
                      showChatPanel ? 'bg-teal-50 text-teal-600' : 'text-stone-600'
                    }`}
                    title="聊天"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="text-[10px]">聊天</span>
                  </button>
                  <button
                    onClick={() => setShowAiMinutes((value) => !value)}
                    className={`flex min-w-[62px] flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-stone-100 ${
                      showAiMinutes ? 'bg-teal-50 text-teal-600' : 'text-stone-600'
                    }`}
                    title="AI 纪要"
                  >
                    <FileText className="h-5 w-5" />
                    <span className="text-[10px]">纪要</span>
                  </button>
                </div>

                <div className="flex justify-center lg:justify-end">
                  <button
                    onClick={handleFinish}
                    disabled={status !== 'in-progress'}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-red-500 transition-all hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent"
                    title="结束会议"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="text-sm font-medium">结束会议</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 聊天面板 */}
        {showChatPanel && selectedType && (
          <div className="absolute bottom-0 right-0 top-0 z-30 w-80 overflow-y-auto border-l border-stone-200 bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-stone-100 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-stone-800">聊天</h3>
              </div>
              <button
                onClick={() => setShowChatPanel(false)}
                className="text-stone-400 hover:text-stone-600"
                aria-label="关闭聊天面板"
              >
                x
              </button>
            </div>
            <div className="space-y-3 p-4">
              {messages.filter((message) => message.role !== 'system').length === 0 ? (
                <p className="py-8 text-center text-sm text-stone-400">暂无聊天记录</p>
              ) : (
                messages
                  .filter((message) => message.role !== 'system')
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'student' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          message.role === 'interviewer'
                            ? 'bg-teal-50 text-teal-900'
                            : 'bg-amber-50 text-amber-900'
                        }`}
                      >
                        <p className="mb-1 text-[10px] font-medium opacity-70">
                          {message.role === 'interviewer' ? hostName : '我'}
                        </p>
                        <p className="leading-relaxed">{message.content || '语音识别中...'}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* AI 纪要面板 */}
        {showAiMinutes && selectedType && (
          <div className="absolute bottom-0 right-0 top-0 z-30 w-80 overflow-y-auto border-l border-stone-200 bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-stone-100 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-stone-800">AI 纪要</h3>
              </div>
              <button
                onClick={() => setShowAiMinutes(false)}
                className="text-stone-400 hover:text-stone-600"
                aria-label="关闭纪要面板"
              >
                x
              </button>
            </div>
            <div className="space-y-3 p-4">
              {aiMinutes.length === 0 ? (
                <p className="py-8 text-center text-sm text-stone-400">面试开始后，纪要将自动记录</p>
              ) : (
                aiMinutes.map((minute, index) => (
                  <div
                    key={`${minute}-${index}`}
                    className="rounded-lg bg-stone-50 p-3 text-sm leading-relaxed text-stone-700"
                  >
                    {minute}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
