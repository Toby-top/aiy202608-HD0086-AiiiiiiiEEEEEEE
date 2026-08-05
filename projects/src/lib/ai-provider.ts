import { getCloudflareContext } from '@opennextjs/cloudflare';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  responseFormat?: 'json_object';
}

interface DeepSeekChatCompletion {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

type RuntimeEnv = CloudflareEnv & Record<string, string | undefined>;

function getRuntimeEnvValue(name: string) {
  const processValue = process.env[name]?.trim();
  if (processValue) return processValue;

  try {
    const cloudflareEnv = getCloudflareContext().env as RuntimeEnv;
    return cloudflareEnv[name]?.trim();
  } catch {
    return undefined;
  }
}

function getDeepSeekConfig() {
  return {
    apiKey: getRuntimeEnvValue('DEEPSEEK_API_KEY'),
    baseUrl: getRuntimeEnvValue('DEEPSEEK_BASE_URL') || 'https://api.deepseek.com',
    model: getRuntimeEnvValue('DEEPSEEK_MODEL') || 'deepseek-chat',
  };
}

export function isDeepSeekConfigured() {
  const apiKey = getDeepSeekConfig().apiKey;
  return Boolean(apiKey && !/^sk-your-|^your_/i.test(apiKey));
}

export async function createChatCompletion({
  messages,
  temperature = 0.7,
  responseFormat,
}: ChatCompletionOptions) {
  const { apiKey, baseUrl, model } = getDeepSeekConfig();

  if (!isDeepSeekConfigured()) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
      ...(responseFormat ? { response_format: { type: responseFormat } } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`DeepSeek request failed: ${response.status} ${errorText.slice(0, 200)}`);
  }

  const data = (await response.json()) as DeepSeekChatCompletion;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('DeepSeek returned an empty response');
  }

  return content;
}

export function extractJsonObject(content: string) {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Model response did not include a JSON object');
  }

  return JSON.parse(jsonMatch[0]) as unknown;
}
