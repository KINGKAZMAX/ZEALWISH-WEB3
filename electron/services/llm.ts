import type { ChatMessage, ChatResponse, Emotion, MemorySummary } from "../../src/types";

const LEGACY_ANTHROPIC_MESSAGES_PATH = "/v1/messages";
const LEGACY_OPENAI_CHAT_PATH = "/v1/chat/completions";
const DEFAULT_ANTHROPIC_BASE_URL = "https://token-plan-cn.xiaomimimo.com/anthropic";
const DEFAULT_ANTHROPIC_MODEL = "mimo-v2.5-pro";
const HERMES_CHAT_COMPLETIONS_PATH = "/v1/chat/completions";
const DEFAULT_HERMES_BASE_URL = "http://127.0.0.1:8642";
const DEFAULT_HERMES_MODEL = "hermes-agent";

type LLMProvider = "hermes" | "legacy" | "siliconflow";

interface LLMCallOptions {
  sessionId?: string;
  signal?: AbortSignal;
}

const demoFallbackSummary = {
  period: "demo",
  topics: ["路演 demo"],
  emotions: ["期待"],
  keyMoments: ["已启用本地摘要兜底"],
  relationshipSignals: {
    closeness: 0.2,
    note: "当前使用摘要降级模式。",
  },
} satisfies MemorySummary;

function buildMockResponse(userMessage: string): ChatResponse {
  if (/累|困|焦虑|压力/.test(userMessage)) {
    return {
      text: "看得出来你已经绷很久了。先把最能演示的那条链路跑通，别跟自己硬耗。",
      emotion: "sad",
      growthEvent: "她注意到你已经在强撑，开始主动提醒你别把自己压垮。",
    };
  }

  if (/完成|搞定|跑通|好了/.test(userMessage)) {
    return {
      text: "行，这次算你真做出来了。别停，顺手把能上台讲的那几幕也准备好。",
      emotion: "happy",
      growthEvent: "她第一次认可你把关键结果做出来。",
    };
  }

  if (/你好|在吗|哈喽/.test(userMessage)) {
    return {
      text: "在。今天看你又在方案和代码之间来回横跳，所以这次别聊空的，直接推进。",
      emotion: "thinking",
      growthEvent: null,
    };
  }

  return {
    text: "你今天已经做了不少事，但真正缺的还是一个能给别人看懂的结果。我盯着，你继续。",
    emotion: "thinking",
    growthEvent: null,
  };
}

function isEmotion(value: unknown): value is Emotion {
  return ["idle", "happy", "shy", "thinking", "sad", "angry"].includes(String(value));
}

function getEnvValue(name: string) {
  const value = process.env[name];

  if (!value || value === "undefined" || value === "null") {
    return undefined;
  }

  return value;
}

function getProvider(): LLMProvider {
  const provider = getEnvValue("OC_CHAT_PROVIDER");
  if (provider === "legacy" || provider === "siliconflow") {
    return provider;
  }
  return "hermes";
}

function getLegacyBaseUrl() {
  return (getEnvValue("ANTHROPIC_BASE_URL") || DEFAULT_ANTHROPIC_BASE_URL).replace(/\/$/, "");
}

function isLegacyOpenAICompatible() {
  const baseUrl = getLegacyBaseUrl();
  return (
    baseUrl.includes("openai-next.com") ||
    baseUrl.includes("xiaomimimo.com/v1") ||
    baseUrl.includes("moocoo.ai") ||
    baseUrl.includes("stepfun.com") ||
    getEnvValue("LEGACY_API_FORMAT") === "openai"
  );
}

function getLegacyModel() {
  return getEnvValue("ANTHROPIC_DEFAULT_HAIKU_MODEL") || DEFAULT_ANTHROPIC_MODEL;
}

function getHermesBaseUrl() {
  return (getEnvValue("HERMES_BASE_URL") || DEFAULT_HERMES_BASE_URL).replace(/\/$/, "");
}

function getHermesModel() {
  return getEnvValue("HERMES_MODEL") || DEFAULT_HERMES_MODEL;
}

function getSiliconFlowBaseUrl() {
  return (getEnvValue("SILICONFLOW_BASE_URL") || "https://api.siliconflow.cn/v1").replace(/\/$/, "");
}

function getSiliconFlowModel() {
  return getEnvValue("SILICONFLOW_MODEL") || getEnvValue("HERMES_MODEL") || "deepseek-ai/DeepSeek-V4-Flash";
}

function getLegacyResponseTextBlock(data: unknown) {
  if (!data || typeof data !== "object" || !("content" in data) || !Array.isArray(data.content)) {
    return null;
  }

  for (const item of data.content) {
    if (
      item &&
      typeof item === "object" &&
      "type" in item &&
      item.type === "text" &&
      "text" in item &&
      typeof item.text === "string"
    ) {
      return item.text;
    }
  }

  return null;
}

function getHermesResponseText(data: unknown) {
  if (!data || typeof data !== "object" || !("choices" in data) || !Array.isArray(data.choices)) {
    return null;
  }

  const firstChoice = data.choices[0];
  if (!firstChoice || typeof firstChoice !== "object" || !("message" in firstChoice)) {
    return null;
  }

  const message = firstChoice.message;
  if (!message || typeof message !== "object" || !("content" in message)) {
    return null;
  }

  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    const textParts = message.content
      .map((item: unknown) => {
        if (
          item &&
          typeof item === "object" &&
          "type" in item &&
          (item.type === "text" || item.type === "output_text") &&
          "text" in item &&
          typeof item.text === "string"
        ) {
          return item.text;
        }

        return "";
      })
      .filter(Boolean);

    return textParts.length ? textParts.join("\n") : null;
  }

  return null;
}

function cleanVisibleResponseText(text: string) {
  return text
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseJsonResponse(jsonText: string): ChatResponse | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText.trim());
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const response = parsed as { text?: unknown; emotion?: unknown; growthEvent?: unknown };

  if (typeof response.text === "string" && isEmotion(response.emotion)) {
    return {
      text: response.text,
      emotion: response.emotion,
      growthEvent: typeof response.growthEvent === "string" ? response.growthEvent : null,
    };
  }

  return null;
}

function parseStructuredResponse(rawText: string): ChatResponse | null {
  const normalizedText = rawText.trim();
  const fencedMatch = normalizedText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fencedMatch ? fencedMatch[1].trim() : normalizedText;
  const directResponse = parseJsonResponse(jsonText);

  if (directResponse) {
    return directResponse;
  }

  const embeddedResponses: ChatResponse[] = [];
  const withoutFencedJson = normalizedText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, (block, inner) => {
    const response = parseJsonResponse(String(inner));
    if (!response) {
      return block;
    }

    embeddedResponses.push(response);
    return "";
  });
  const visibleText = cleanVisibleResponseText(withoutFencedJson);
  const embeddedResponse = embeddedResponses[embeddedResponses.length - 1];

  if (embeddedResponse) {
    return {
      ...embeddedResponse,
      text: visibleText || embeddedResponse.text,
    };
  }

  for (let start = normalizedText.lastIndexOf("{"); start >= 0; start = normalizedText.lastIndexOf("{", start - 1)) {
    const maybeJson = normalizedText.slice(start).trim();
    const response = parseJsonResponse(maybeJson);

    if (!response) {
      continue;
    }

    const leadingText = cleanVisibleResponseText(normalizedText.slice(0, start));
    return {
      ...response,
      text: leadingText || response.text,
    };
  }

  return null;
}

function parseResponseContent(content: string): ChatResponse {
  const structuredResponse = parseStructuredResponse(content);

  if (structuredResponse) {
    return structuredResponse;
  }

  return {
    text: cleanVisibleResponseText(content),
    emotion: "thinking",
    growthEvent: null,
  };
}

function isProviderErrorText(content: string) {
  const text = content.trim();
  return (
    /^Error code:\s*\d+/i.test(text) ||
    /^API call failed after \d+ retries:/i.test(text) ||
    /No inference provider configured/i.test(text)
  );
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

async function callLegacyLLM(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  userMessage: string,
  signal?: AbortSignal,
) {
  const authToken = getEnvValue("ANTHROPIC_AUTH_TOKEN");

  if (!authToken) {
    return buildMockResponse(userMessage);
  }

  const baseUrl = getLegacyBaseUrl();
  const useOpenAI = isLegacyOpenAICompatible();

  if (useOpenAI) {
    const response = await fetch(`${baseUrl}${LEGACY_OPENAI_CHAT_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      signal,
      body: JSON.stringify({
        model: getLegacyModel(),
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      return buildMockResponse(userMessage);
    }

    const data = await response.json();
    const content = getHermesResponseText(data);

    if (!content?.trim()) {
      return buildMockResponse(userMessage);
    }

    return parseResponseContent(content);
  }

  const response = await fetch(`${baseUrl}${LEGACY_ANTHROPIC_MESSAGES_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      "x-api-key": authToken,
    },
    signal,
    body: JSON.stringify({
      model: getLegacyModel(),
      system: systemPrompt,
      max_tokens: 1024,
      messages,
    }),
  });

  if (!response.ok) {
    return buildMockResponse(userMessage);
  }

  const data = await response.json();
  const content = getLegacyResponseTextBlock(data);

  if (!content?.trim()) {
    return buildMockResponse(userMessage);
  }

  return parseResponseContent(content);
}

async function callHermesLLM(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  userMessage: string,
  options?: LLMCallOptions,
) {
  const hermesApiKey = getEnvValue("HERMES_API_KEY");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (hermesApiKey) {
    headers.Authorization = `Bearer ${hermesApiKey}`;
  }

  if (options?.sessionId && hermesApiKey) {
    headers["X-Hermes-Session-Id"] = options.sessionId;
  }

  const response = await fetch(`${getHermesBaseUrl()}${HERMES_CHAT_COMPLETIONS_PATH}`, {
    method: "POST",
    headers,
    signal: options?.signal,
    body: JSON.stringify({
      model: getHermesModel(),
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });


  if (!response.ok) {
    return buildMockResponse(userMessage);
  }

  const data = await response.json();
  const content = getHermesResponseText(data);

  if (!content?.trim()) {
    return buildMockResponse(userMessage);
  }

  if (isProviderErrorText(content)) {
    return callLegacyLLM(systemPrompt, messages, userMessage, options?.signal);
  }

  return parseResponseContent(content);
}

async function callSiliconFlowLLM(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  userMessage: string,
  signal?: AbortSignal,
) {
  const apiKey = getEnvValue("SILICONFLOW_API_KEY") || getEnvValue("OPENAI_API_KEY");

  if (!apiKey) {
    return buildMockResponse(userMessage);
  }

  const response = await fetch(`${getSiliconFlowBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model: getSiliconFlowModel(),
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });

  if (!response.ok) {
    return buildMockResponse(userMessage);
  }

  const data = await response.json();
  const content = getHermesResponseText(data);

  if (!content?.trim()) {
    return buildMockResponse(userMessage);
  }

  if (isProviderErrorText(content)) {
    return buildMockResponse(userMessage);
  }

  return parseResponseContent(content);
}

export async function callLLM(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  options?: LLMCallOptions,
): Promise<ChatResponse> {
  const userMessage = messages[messages.length - 1]?.content ?? "";

  if (process.env.OC_DEMO_FORCE_MOCK_LLM === "1") {
    return buildMockResponse(userMessage);
  }

  try {
    const provider = getProvider();
    if (provider === "legacy") {
      return await callLegacyLLM(systemPrompt, messages, userMessage, options?.signal);
    }
    if (provider === "siliconflow") {
      return await callSiliconFlowLLM(systemPrompt, messages, userMessage, options?.signal);
    }

    return await callHermesLLM(systemPrompt, messages, userMessage, options);
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    return buildMockResponse(userMessage);
  }
}

export function summarizeChunk(messages: ChatMessage[], period: string): MemorySummary {
  if (!messages.length) {
    return demoFallbackSummary;
  }

  const topics = Array.from(
    new Set(
      messages
        .map((message) => message.content.split(/[，。！？\s]/)[0])
        .filter(Boolean),
    ),
  ).slice(0, 5);

  const emotions = messages.some((message) => /焦虑|压力|累/.test(message.content)) ? ["焦虑"] : ["平稳"];
  const keyMoments = messages.slice(-3).map((message) => `${message.sender}：${message.content}`);

  return {
    period,
    topics,
    emotions,
    keyMoments,
    relationshipSignals: {
      closeness: Math.min(1, messages.length / 20),
      note: "基于离线消息数量生成的摘要。",
    },
  };
}
