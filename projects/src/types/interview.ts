/** 面试类型枚举 */
export type InterviewType = 'common-app' | 'alumni' | 'initialview';

/** 面试类型配置 */
export interface InterviewTypeConfig {
  type: InterviewType;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  tips?: string;
}

/** 消息角色 */
export type MessageRole = 'interviewer' | 'student' | 'system';

/** 聊天消息 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  audioUrl?: string;
  duration?: number;
  subtitle?: string;
  stage?: InterviewStage;
}

/** 面试状态 */
export type InterviewStatus = 'idle' | 'preparing' | 'in-progress' | 'finishing' | 'completed';

/** 录音状态 */
export type RecordingStatus = 'idle' | 'recording' | 'processing';

/** 评分维度 */
export interface ScoreDimension {
  name: string;
  score: number;
  maxScore: number;
  comment: string;
}

/** 面试结果 */
export interface InterviewResult {
  id: string;
  interviewType: InterviewType;
  totalScore: number;
  maxScore: number;
  grade: string;
  overallComment: string;
  dimensions: ScoreDimension[];
  messages: ChatMessage[];
  duration: number;
  createdAt: number;
}

/** API 返回的 1-10 分制评分 */
export interface ScoringApiResult {
  scores: Record<string, { score: number; comment: string }>;
  totalScore: number;
  grade: string;
  summary: string;
  strengths?: string[];
  improvements?: string[];
}

/** 报告页使用的 100 分制评分 */
export interface StoredInterviewScore {
  totalScore: number;
  maxScore: number;
  grade: string;
  overallComment: string;
  dimensions: ScoreDimension[];
  radarScores: Record<string, number>;
  strengths: string[];
  improvements: string[];
  generatedAt: number;
}

/** API 请求参数 */
export interface InterviewRequest {
  interviewType: InterviewType;
  message: string;
  history: ChatMessage[];
}

/** API 响应 */
export interface InterviewResponse {
  success: boolean;
  data?: {
    reply: string;
    messageId: string;
    uiCmd?: UICmdData;
  };
  error?: string;
}

/** UI_CMD 数据类型 */
export interface UICmdData {
  action: 'ask' | 'follow_up' | 'end';
  speaker_name: string;
  speech_text: string;
  subtitle_text: string;
  chat_bubble: string;
  mic_status: 'on' | 'off';
  camera_status: 'on' | 'off';
  current_stage: InterviewStage;
  score_hidden: {
    fluency: number;
    logic: number;
    confidence: number;
  };
}

/** 面试阶段类型 */
export type InterviewStage = 'ice_breaking' | 'academics' | 'critical_thinking' | 'wrap_up';

/** ASR 语音识别响应 */
export interface ASRResponse {
  success: boolean;
  text?: string;
  duration?: number;
  data?: {
    text: string;
    duration?: number;
  };
  error?: string;
  message?: string;
  debug?: {
    type?: string;
    size?: number;
  };
}

/** AI 标注类型 */
export type AnnotationType =
  | 'fast-pace'       // 语速快
  | 'nervous'         // 情绪紧张
  | 'key-point'       // 关键问题
  | 'good-answer'     // 回答不错
  | 'pause-long'      // 停顿过长
  | 'filler-word';    // 填充词过多

/** AI 标注 */
export interface Annotation {
  type: AnnotationType;
  label: string;
  detail: string;
  /** 在音频中的起始时间（秒） */
  startTime: number;
  /** 在音频中的结束时间（秒） */
  endTime: number;
}

/** 面试片段（一轮问答） */
export interface InterviewSegment {
  id: string;
  /** 片段类型 */
  type: 'opening' | 'question' | 'answer' | 'closing';
  /** 角色 */
  role: 'interviewer' | 'student' | 'system';
  /** 文字内容 */
  content: string;
  /** 在整体录音中的起始时间（秒） */
  startTime: number;
  /** 在整体录音中的结束时间（秒） */
  endTime: number;
  /** 问题编号（仅 question 类型有） */
  questionIndex?: number;
  /** AI 标注列表 */
  annotations: Annotation[];
}

/** 面试回放数据 */
export interface InterviewPlayback {
  id: string;
  interviewType: InterviewType;
  /** 完整录音的 URL */
  audioUrl: string;
  /** 完整录像的 URL */
  videoUrl?: string;
  /** 总时长（秒） */
  totalDuration: number;
  /** 面试片段列表 */
  segments: InterviewSegment[];
  /** 对话记录 */
  messages?: ChatMessage[];
  /** 创建时间 */
  createdAt: number;
}
