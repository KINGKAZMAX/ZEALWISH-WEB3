import { afterEach, describe, expect, it, vi } from "vitest";
import { createOcWorldCapabilities } from "../electron/capabilities/facade";
import type { ChatSendPayload, TtsSynthesizePayload } from "../src/types";

const chatResult = {
  text: "收到",
  emotion: "happy" as const,
  growthEvent: null,
  intimacy: 42,
  stage: "friend" as const,
  source: "mock" as const,
};

const greetingResult = {
  text: "欢迎回来",
  emotion: "idle" as const,
  growthEvent: null,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("oc world capabilities facade", () => {
  it("delegates chat, memory, airjelly, hermes, tts, and image capabilities", async () => {
    const chat = vi.fn().mockResolvedValue(chatResult);
    const generateGreeting = vi.fn().mockResolvedValue(greetingResult);
    const loadOCHistory = vi.fn().mockResolvedValue([{ userMessage: "hi" }]);
    const loadRecentSummaries = vi.fn().mockResolvedValue([{ period: "最近" }]);
    const getAirJellyContext = vi.fn().mockResolvedValue({ source: "mock", events: [], tasks: [], appUsage: [] });
    const getStatus = vi.fn().mockReturnValue({ state: "healthy", pid: 1, restartCount: 0, lastError: null, lastStartedAt: null, lastHealthCheckAt: null });
    const getTtsStatus = vi.fn().mockReturnValue({ provider: "stepfun", configured: true, voiceType: "voice", lastError: null });
    const synthesizeSpeech = vi.fn().mockResolvedValue({ provider: "stepfun", requestId: "req-1", audioBase64: "AAAA", mimeType: "audio/mpeg", encoding: "mp3", durationMs: null });
    const generateImage = vi.fn().mockResolvedValue({ imageBase64: "BBBB", mimeType: "image/png", savedPath: "/tmp/avatar.png" });

    const capabilities = createOcWorldCapabilities({
      services: {
        chat,
        generateGreeting,
        loadOCHistory,
        loadRecentSummaries,
        getAirJellyContext,
        hermesManager: { getStatus },
        getTtsStatus,
        synthesizeSpeech,
        generateImage,
      },
    });

    await expect(
      capabilities.chat.sendMessage({
        userId: "user-001",
        characterId: "char-001",
        userMessage: "你好",
      }),
    ).resolves.toEqual(chatResult);
    await expect(capabilities.chat.getGreeting({ userId: "user-001", characterId: "char-001" })).resolves.toEqual(greetingResult);
    await expect(capabilities.memory.history("user-001", 20)).resolves.toEqual([{ userMessage: "hi" }]);
    await expect(capabilities.memory.summaries("user-001", 3)).resolves.toEqual([{ period: "最近" }]);
    await expect(capabilities.airjelly.getContext()).resolves.toEqual({ source: "mock", events: [], tasks: [], appUsage: [] });
    await expect(capabilities.hermes.getStatus()).resolves.toEqual({ state: "healthy", pid: 1, restartCount: 0, lastError: null, lastStartedAt: null, lastHealthCheckAt: null });
    await expect(capabilities.tts.getStatus()).resolves.toEqual({ provider: "stepfun", configured: true, voiceType: "voice", lastError: null });
    await expect(capabilities.tts.synthesize({ text: "hello" })).resolves.toEqual({ provider: "stepfun", requestId: "req-1", audioBase64: "AAAA", mimeType: "audio/mpeg", encoding: "mp3", durationMs: null });
    await expect(capabilities.image.generate({ prompt: "avatar" })).resolves.toEqual({ imageBase64: "BBBB", mimeType: "image/png", savedPath: "/tmp/avatar.png" });

    expect(chat).toHaveBeenCalledWith({ userId: "user-001", characterId: "char-001", userMessage: "你好" }, { signal: expect.any(AbortSignal) });
    expect(generateGreeting).toHaveBeenCalledWith({ userId: "user-001", characterId: "char-001" });
    expect(loadOCHistory).toHaveBeenCalledWith("user-001", 20, undefined);
    expect(loadRecentSummaries).toHaveBeenCalledWith("user-001", 3, undefined);
    expect(getAirJellyContext).toHaveBeenCalledWith(undefined);
    expect(getStatus).toHaveBeenCalled();
    expect(getTtsStatus).toHaveBeenCalled();
    expect(synthesizeSpeech).toHaveBeenCalledWith(expect.objectContaining({ text: "hello", requestId: expect.any(String) }), { signal: expect.any(AbortSignal) });
    expect(generateImage).toHaveBeenCalledWith({ prompt: "avatar" }, "char-001", undefined);
  });

  it("cancels active chat by user and character session key", async () => {
    let release!: () => void;
    let observedSignal!: AbortSignal;
    const chat = vi.fn().mockImplementation(async (_payload: ChatSendPayload, options?: { signal?: AbortSignal }) => {
      observedSignal = options?.signal as AbortSignal;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return chatResult;
    });

    const capabilities = createOcWorldCapabilities({
      services: {
        chat,
        generateGreeting: vi.fn(),
        loadOCHistory: vi.fn(),
        loadRecentSummaries: vi.fn(),
        getAirJellyContext: vi.fn(),
        hermesManager: { getStatus: vi.fn() },
        getTtsStatus: vi.fn(),
        synthesizeSpeech: vi.fn(),
        generateImage: vi.fn(),
      },
    });

    const pending = capabilities.chat.sendMessage({
      userId: "user-001",
      characterId: "char-001",
      userMessage: "你好",
      interrupt: false,
    });

    expect(observedSignal.aborted).toBe(false);
    await expect(capabilities.chat.cancelActive({ userId: "user-001", characterId: "char-001" })).resolves.toBe(true);
    expect(observedSignal.aborted).toBe(true);
    release();
    await pending;
  });

  it("cancels active tts by request id or globally", async () => {
    let releaseFirst!: () => void;
    let releaseSecond!: () => void;
    let firstSignal!: AbortSignal;
    let secondSignal!: AbortSignal;
    const synthesizeSpeech = vi
      .fn()
      .mockImplementationOnce(async (_payload: TtsSynthesizePayload, options?: { signal?: AbortSignal }) => {
        firstSignal = options?.signal as AbortSignal;
        await new Promise<void>((resolve) => {
          releaseFirst = resolve;
        });
        return { provider: "stepfun", requestId: "req-1", audioBase64: "AAAA", mimeType: "audio/mpeg", encoding: "mp3", durationMs: null };
      })
      .mockImplementationOnce(async (_payload: TtsSynthesizePayload, options?: { signal?: AbortSignal }) => {
        secondSignal = options?.signal as AbortSignal;
        await new Promise<void>((resolve) => {
          releaseSecond = resolve;
        });
        return { provider: "stepfun", requestId: "req-2", audioBase64: "BBBB", mimeType: "audio/mpeg", encoding: "mp3", durationMs: null };
      });

    const capabilities = createOcWorldCapabilities({
      services: {
        chat: vi.fn(),
        generateGreeting: vi.fn(),
        loadOCHistory: vi.fn(),
        loadRecentSummaries: vi.fn(),
        getAirJellyContext: vi.fn(),
        hermesManager: { getStatus: vi.fn() },
        getTtsStatus: vi.fn(),
        synthesizeSpeech,
        generateImage: vi.fn(),
      },
    });

    const firstPending = capabilities.tts.synthesize({ text: "one", requestId: "req-1", interrupt: false });
    const secondPending = capabilities.tts.synthesize({ text: "two", requestId: "req-2", interrupt: false });

    await expect(capabilities.tts.cancelActive({ requestId: "req-1" })).resolves.toBe(true);
    expect(firstSignal.aborted).toBe(true);
    expect(secondSignal.aborted).toBe(false);

    await expect(capabilities.tts.cancelActive()).resolves.toBe(true);
    expect(secondSignal.aborted).toBe(true);

    releaseFirst();
    releaseSecond();
    await Promise.all([firstPending, secondPending]);
  });
});
