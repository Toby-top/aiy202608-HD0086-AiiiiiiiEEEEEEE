'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { INTERVIEW_TYPES, type InterviewType } from '@/lib/interview-prompt';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface TimelineEvent {
  time: number;
  text: string;
  type: 'normal' | 'highlight' | 'warning';
  messageIndex: number;
}

const INTERVIEW_STAGES = [
  { name: '破冰', duration: '2 min', questions: [1] },
  { name: '学术兴趣', duration: '5 min', questions: [2, 3] },
  { name: '能力挖掘', duration: '8 min', questions: [4, 5, 6] },
  { name: '挑战成长', duration: '5 min', questions: [7, 8] },
  { name: '抗压测试', duration: '5 min', questions: [9] },
  { name: '反向提问', duration: '5 min', questions: [10] },
  { name: '结束', duration: '1 min', questions: [] },
];

export default function InterviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewType = (searchParams.get('type') || 'common-app') as InterviewType;
  const interviewInfo = INTERVIEW_TYPES[interviewType as keyof typeof INTERVIEW_TYPES];

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [audioRecordings, setAudioRecordings] = useState<{ index: number; blob: Blob; url: string }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Keep ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer
  useEffect(() => {
    if (interviewStarted) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [interviewStarted]);

  // Update stage based on message count
  useEffect(() => {
    const msgCount = messages.length;
    if (msgCount <= 2) setCurrentStage(0);
    else if (msgCount <= 6) setCurrentStage(1);
    else if (msgCount <= 12) setCurrentStage(2);
    else if (msgCount <= 16) setCurrentStage(3);
    else if (msgCount <= 20) setCurrentStage(4);
    else if (msgCount <= 24) setCurrentStage(5);
    else setCurrentStage(6);
  }, [messages.length]);

  // Detect timeline events from messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant') {
        // Check for stress/pressure indicators
        const stressKeywords = ['压力', '紧张', 'stress', 'nervous', '挑战', 'challenge', '困难', 'difficult'];
        const hasStress = stressKeywords.some(k => lastMsg.content.toLowerCase().includes(k));

        const events: TimelineEvent[] = [];
        const time = Math.floor(elapsedTime / 60);

        if (hasStress) {
          events.push({
            time,
            text: '⚠️ 压力情境触发 - 面试官追问深度问题',
            type: 'warning',
            messageIndex: messages.length - 1,
          });
        }

        // Detect stage transitions
        if (messages.length === 2 || messages.length === 6 || messages.length === 12 || messages.length === 16 || messages.length === 20) {
          events.push({
            time,
            text: `📌 进入${INTERVIEW_STAGES[Math.min(Math.floor(messages.length / 4), INTERVIEW_STAGES.length - 1)].name}环节`,
            type: 'highlight',
            messageIndex: messages.length - 1,
          });
        }

        if (events.length > 0) {
          setTimelineEvents(prev => [...prev, ...events]);
        }
      }
    }
  }, [messages.length, elapsedTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeShort = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  // Clean up audio URLs on unmount
  useEffect(() => {
    return () => {
      audioRecordings.forEach(rec => URL.revokeObjectURL(rec.url));
    };
  }, [audioRecordings]);

  // Start interview
  const startInterview = useCallback(async () => {
    setInterviewStarted(true);
    setIsLoading(true);

    const initialMessages = [{
      role: 'user' as const,
      content: `I'm ready to start my ${interviewInfo?.name || 'Common App'} interview. Please begin.`,
    }];

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: initialMessages, interviewType }),
      });

      if (!response.ok) throw new Error('Failed to start interview');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setMessages([{
                    role: 'assistant',
                    content: fullContent,
                    timestamp: Date.now(),
                  }]);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      setMessages([{
        role: 'assistant',
        content: "Hello! Welcome to your interview. I'm Dr. Anderson. Let's begin with you telling me a little about yourself.",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [interviewType, interviewInfo]);

  // Start interview on mount
  useEffect(() => {
    startInterview();
  }, [startInterview]);

  // Send message to interviewer
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const allMessages = [...messages, userMessage];

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, interviewType }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      // Add empty assistant message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const decodedText = decoder.decode(value);
          const lines = decodedText.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: fullContent,
                    };
                    return updated;
                  });
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle text submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  // Start/stop recording
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());

          // Save audio recording
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioRecordings(prev => [...prev, {
            index: messages.length,
            blob: audioBlob,
            url: audioUrl,
          }]);

          // Send to ASR
          setIsInterviewerSpeaking(true);
          try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/api/asr', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              if (data.text) {
                await sendMessage(data.text);
              }
            }
          } catch (error) {
            console.error('ASR error:', error);
          } finally {
            setIsInterviewerSpeaking(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Microphone access error:', error);
        alert('无法访问麦克风，请确保已授权。你也可以使用文字输入。');
      }
    }
  };

  // Play audio recording
  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(console.error);
  };

  // End interview
  const endInterview = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    // Store messages in sessionStorage for the result page
    sessionStorage.setItem('interviewMessages', JSON.stringify(messages));
    sessionStorage.setItem('interviewType', interviewType);

    // Save to localStorage for compare feature
    const record = {
      id: Date.now().toString(),
      interviewType,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      startTime: Date.now() - elapsedTime * 1000,
      duration: elapsedTime,
    };
    const existing = JSON.parse(localStorage.getItem('interview_records') || '[]');
    existing.push(record);
    localStorage.setItem('interview_records', JSON.stringify(existing));

    router.push(`/result?time=${elapsedTime}`);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-white/80 backdrop-blur-sm px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="font-serif text-sm font-semibold">{interviewInfo?.nameCn || '面试'}</h1>
              <p className="text-xs text-muted-foreground">{interviewInfo?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timeline Toggle */}
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showTimeline
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
                <line x1="3" x2="3" y1="12" y2="12" />
                <line x1="3" x2="3" y1="12" y2="12" />
                <line x1="3" x2="3" y1="12" y2="12" />
                <line x1="3" x2="3" y1="12" y2="12" />
              </svg>
              时间轴
            </button>

            {/* Timer */}
            <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatTime(elapsedTime)}
            </div>

            {/* End Interview Button */}
            <button
              onClick={endInterview}
              className="px-3 py-1.5 text-xs font-medium text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/5 transition-colors"
            >
              结束面试
            </button>
          </div>
        </div>
      </header>

      {/* Stage Progress */}
      <div className="border-b border-border/40 bg-white/40 px-6 py-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-1 overflow-x-auto">
            {INTERVIEW_STAGES.map((stage, index) => (
              <div
                key={stage.name}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap transition-colors
                  ${index === currentStage
                    ? 'bg-primary/10 text-primary font-medium'
                    : index < currentStage
                      ? 'text-primary/60'
                      : 'text-muted-foreground/50'
                  }
                `}
              >
                <span className={`
                  w-4 h-4 rounded-full flex items-center justify-center text-[10px]
                  ${index < currentStage
                    ? 'bg-primary text-white'
                    : index === currentStage
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {index < currentStage ? '✓' : index + 1}
                </span>
                <span>{stage.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {isLoading && messages.length === 0 && (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground">面试官正在准备...</p>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 animate-fade-in-up ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Avatar */}
                  <div className={`
                    w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                    ${message.role === 'assistant'
                      ? 'bg-primary text-white'
                      : 'bg-accent/20 text-accent'
                    }
                  `}>
                    {message.role === 'assistant' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`
                    max-w-[80%] rounded-2xl px-4 py-3
                    ${message.role === 'assistant'
                      ? 'bg-white border border-border/60 text-foreground'
                      : 'bg-primary text-primary-foreground'
                    }
                  `}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <div className={`
                      flex items-center gap-2 mt-1.5
                      ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}
                    `}>
                      <span className="text-[10px] text-muted-foreground/60">
                        {formatTimeShort(Math.floor((Date.now() - message.timestamp) / 1000))}前
                      </span>
                      {/* Audio play button for user messages */}
                      {message.role === 'user' && audioRecordings.find(r => r.index === index) && (
                        <button
                          onClick={() => playAudio(audioRecordings.find(r => r.index === index)!.url)}
                          className="text-[10px] text-accent hover:text-accent/80 transition-colors"
                        >
                          ▶ 播放录音
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border/60 bg-white/80 backdrop-blur-sm px-6 py-4">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleTextSubmit} className="flex items-center gap-3">
                {/* Record Button */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isInterviewerSpeaking}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0
                    ${isRecording
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                      : 'bg-white border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                    }
                  `}
                >
                  {isRecording ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  )}
                </button>

                {/* Text Input */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isRecording ? '正在录音...点击按钮停止' : '输入你的回答... (Enter 发送)'}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                      placeholder:text-muted-foreground/50 transition-all"
                    disabled={isRecording || isLoading}
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading || isRecording}
                  className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center
                    hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" x2="11" y1="2" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>

              {/* Recording status */}
              {isRecording && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-500 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  正在录音，点击停止按钮完成录音
                </div>
              )}
              {isInterviewerSpeaking && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  正在识别语音...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Sidebar */}
        {showTimeline && (
          <div className="w-72 border-l border-border/60 bg-white/60 overflow-y-auto custom-scrollbar">
            <div className="p-4">
              <h3 className="font-serif text-sm font-semibold mb-3">面试时间轴</h3>
              {timelineEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">暂无事件记录</p>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border/60" />

                  <div className="space-y-3">
                    {timelineEvents.map((event, index) => (
                      <div key={index} className="flex gap-3 relative">
                        <div className={`
                          w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center
                          ${event.type === 'warning'
                            ? 'bg-amber-100 text-amber-600'
                            : event.type === 'highlight'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }
                        `}>
                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground font-mono">
                            {formatTime(event.time * 60)}
                          </p>
                          <p className="text-xs mt-0.5">{event.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audio Recordings */}
              {audioRecordings.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border/40">
                  <h4 className="text-xs font-medium mb-2">录音记录</h4>
                  <div className="space-y-1.5">
                    {audioRecordings.map((rec, index) => (
                      <button
                        key={index}
                        onClick={() => playAudio(rec.url)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/50 text-xs text-left transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span className="text-muted-foreground">第{rec.index + 1}条回答</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}