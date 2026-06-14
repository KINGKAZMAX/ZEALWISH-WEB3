import { afterEach, describe, expect, it, vi } from "vitest";
import { callLLM, summarizeChunk } from "../electron/services/llm";

const originalEnv = {
  ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN,
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  ANTHROPIC_DEFAULT_HAIKU_MODEL: process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL,
  HERMES_API_KEY: process.env.HERMES_API_KEY,
  HERMES_BASE_URL: process.env.HERMES_BASE_URL,
  HERMES_MODEL: process.env.HERMES_MODEL,
  OC_CHAT_PROVIDER: process.env.OC_CHAT_PROVIDER,
  OC_DEMO_FORCE_MOCK_LLM: process.env.OC_DEMO_FORCE_MOCK_LLM,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  SILICONFLOW_API_KEY: process.env.SILICONFLOW_API_KEY,
  SILICONFLOW_BASE_URL: process.env.SILICONFLOW_BASE_URL,
  SILICONFLOW_MODEL: process.env.SILICONFLOW_MODEL,
};

afterEach(() => {
  vi.unstubAllGlobals();
  process.env.ANTHROPIC_AUTH_TOKEN = originalEnv.ANTHROPIC_AUTH_TOKEN;
  process.env.ANTHROPIC_BASE_URL = originalEnv.ANTHROPIC_BASE_URL;
  process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = originalEnv.ANTHROPIC_DEFAULT_HAIKU_MODEL;
  process.env.HERMES_API_KEY = originalEnv.HERMES_API_KEY;
  process.env.HERMES_BASE_URL = originalEnv.HERMES_BASE_URL;
  process.env.HERMES_MODEL = originalEnv.HERMES_MODEL;
  process.env.OC_CHAT_PROVIDER = originalEnv.OC_CHAT_PROVIDER;
  process.env.OC_DEMO_FORCE_MOCK_LLM = originalEnv.OC_DEMO_FORCE_MOCK_LLM;
  process.env.OPENAI_API_KEY = originalEnv.OPENAI_API_KEY;
  process.env.SILICONFLOW_API_KEY = originalEnv.SILICONFLOW_API_KEY;
  process.env.SILICONFLOW_BASE_URL = originalEnv.SILICONFLOW_BASE_URL;
  process.env.SILICONFLOW_MODEL = originalEnv.SILICONFLOW_MODEL;
});

describe("summary generation", () => {
  it("creates a weekly summary from markdown-parsed messages", () => {
    const summary = summarizeChunk(
      [
        { timestamp: 1, sender: "pika", content: "黑客松方案终于清楚一点了", type: "text" },
        { timestamp: 2, sender: "朋友", content: "但你压力还是很大", type: "text" },
      ],
      "2026-04-W4",
    );

    expect(summary.period).toBe("2026-04-W4");
    expect(summary.topics.length).toBeGreaterThan(0);
    expect(summary.keyMoments.length).toBe(2);
  });

  it("uses Hermes chat completions by default", async () => {
    delete process.env.OC_CHAT_PROVIDER;
    process.env.HERMES_BASE_URL = "http://127.0.0.1:8642";
    process.env.HERMES_MODEL = "hermes-agent";
    delete process.env.HERMES_API_KEY;
    process.env.OC_DEMO_FORCE_MOCK_LLM = "0";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                role: "assistant",
                content: JSON.stringify({
                  text: "收到",
                  emotion: "happy",
                  growthEvent: null,
                }),
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const response = await callLLM(
      "system prompt",
      [{ role: "user", content: "你好" }],
      { sessionId: "user-1:char-1" },
    );

    expect(response).toEqual({
      text: "收到",
      emotion: "happy",
      growthEvent: null,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8642/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      model: "hermes-agent",
      messages: [
        { role: "system", content: "system prompt" },
        { role: "user", content: "你好" },
      ],
    });
  });

  it("sends Bearer auth and session header when Hermes API key is configured", async () => {
    process.env.HERMES_BASE_URL = "http://127.0.0.1:8642";
    process.env.HERMES_MODEL = "hermes-agent";
    process.env.HERMES_API_KEY = "hermes-secret";
    process.env.OC_DEMO_FORCE_MOCK_LLM = "0";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                role: "assistant",
                content: JSON.stringify({
                  text: "收到",
                  emotion: "happy",
                  growthEvent: null,
                }),
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await callLLM(
      "system prompt",
      [{ role: "user", content: "你好" }],
      { sessionId: "user-1:char-1" },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8642/v1/chat/completions",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer hermes-secret",
          "X-Hermes-Session-Id": "user-1:char-1",
        },
      }),
    );
  });

  it("uses legacy anthropic-compatible config when provider is legacy", async () => {
    process.env.ANTHROPIC_AUTH_TOKEN = "test-token";
    process.env.ANTHROPIC_BASE_URL = "https://token-plan-cn.xiaomimimo.com/anthropic";
    process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = "mimo-v2.5-pro";
    process.env.OC_CHAT_PROVIDER = "legacy";
    process.env.OC_DEMO_FORCE_MOCK_LLM = "0";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                text: "收到",
                emotion: "happy",
                growthEvent: null,
              }),
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const response = await callLLM("system prompt", [{ role: "user", content: "你好" }]);

    expect(response).toEqual({
      text: "收到",
      emotion: "happy",
      growthEvent: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://token-plan-cn.xiaomimimo.com/anthropic/v1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
          "x-api-key": "test-token",
        }),
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(requestInit?.body))).toEqual(
      expect.objectContaining({
        model: "mimo-v2.5-pro",
        system: "system prompt",
        messages: [{ role: "user", content: "你好" }],
      }),
    );
  });

  it("uses SiliconFlow OpenAI-compatible config when provider is siliconflow", async () => {
    process.env.OC_CHAT_PROVIDER = "siliconflow";
    process.env.SILICONFLOW_API_KEY = "sf-secret";
    process.env.SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1";
    process.env.SILICONFLOW_MODEL = "deepseek-ai/DeepSeek-V4-Flash";
    process.env.OC_DEMO_FORCE_MOCK_LLM = "0";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                role: "assistant",
                content: JSON.stringify({
                  text: "收到",
                  emotion: "happy",
                  growthEvent: null,
                }),
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const response = await callLLM("system prompt", [{ role: "user", content: "你好" }]);

    expect(response).toEqual({
      text: "收到",
      emotion: "happy",
      growthEvent: null,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.siliconflow.cn/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer sf-secret",
        },
      }),
    );
  });

  it("falls back to mock response when Hermes request fails", async () => {
    process.env.OC_DEMO_FORCE_MOCK_LLM = "0";

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const response = await callLLM("system prompt", [{ role: "user", content: "你好" }]);

    expect(response).toEqual({
      text: "在。今天看你又在方案和代码之间来回横跳，所以这次别聊空的，直接推进。",
      emotion: "thinking",
      growthEvent: null,
    });
  });

  it("falls back to legacy provider when Hermes returns a provider error as text", async () => {
    process.env.ANTHROPIC_AUTH_TOKEN = "test-token";
    process.env.ANTHROPIC_BASE_URL = "https://token-plan-cn.xiaomimimo.com/anthropic";
    process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = "mimo-v2.5-pro";
    process.env.HERMES_BASE_URL = "http://127.0.0.1:8642";
    process.env.HERMES_MODEL = "mimo-v2.5-pro";
    delete process.env.OC_CHAT_PROVIDER;
    process.env.OC_DEMO_FORCE_MOCK_LLM = "0";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "Error code: 401 - token invalid",
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  text: "降级成功",
                  emotion: "happy",
                  growthEvent: null,
                }),
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const response = await callLLM("system prompt", [{ role: "user", content: "你好" }]);

    expect(response).toEqual({
      text: "降级成功",
      emotion: "happy",
      growthEvent: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:8642/v1/chat/completions");
    expect(fetchMock.mock.calls[1][0]).toBe("https://token-plan-cn.xiaomimimo.com/anthropic/v1/messages");
  });

  it("uses Hermes plain text when the response is not structured JSON", async () => {
    process.env.OC_DEMO_FORCE_MOCK_LLM = "0";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "plain text",
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    const response = await callLLM("system prompt", [{ role: "user", content: "你好" }]);

    expect(response).toEqual({
      text: "plain text",
      emotion: "thinking",
      growthEvent: null,
    });
  });

  it("filters duplicated fenced JSON from Hermes responses", async () => {
    process.env.OC_DEMO_FORCE_MOCK_LLM = "0";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: [
                    "刚才查过了，你那边现在晴天，23°C，体感 25°C，湿度 50%，微风。",
                    "",
                    '```json\n{"text":"刚才查过了，晴天 23°C，体感 25°C。","emotion":"happy","growthEvent":null}\n```',
                  ].join("\n"),
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    const response = await callLLM("system prompt", [{ role: "user", content: "天气怎么样" }]);

    expect(response).toEqual({
      text: "刚才查过了，你那边现在晴天，23°C，体感 25°C，湿度 50%，微风。",
      emotion: "happy",
      growthEvent: null,
    });
  });

  it("filters duplicated trailing JSON from Hermes responses", async () => {
    process.env.OC_DEMO_FORCE_MOCK_LLM = "0";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  role: "assistant",
                  content:
                    '先喝口水，回来继续。\n{"text":"先喝口水，回来继续。","emotion":"thinking","growthEvent":null}',
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    const response = await callLLM("system prompt", [{ role: "user", content: "我有点累" }]);

    expect(response).toEqual({
      text: "先喝口水，回来继续。",
      emotion: "thinking",
      growthEvent: null,
    });
  });
});
