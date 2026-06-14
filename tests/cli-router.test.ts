import { describe, expect, it, vi } from "vitest";
import { runCliCommand } from "../cli/router";

function createCapabilities() {
  return {
    chat: {
      sendMessage: vi.fn().mockResolvedValue({ text: "收到", emotion: "happy", growthEvent: null, intimacy: 1, stage: "friend", source: "mock" }),
      getGreeting: vi.fn().mockResolvedValue({ text: "欢迎回来", emotion: "idle", growthEvent: null }),
      cancelActive: vi.fn(),
    },
    memory: {
      history: vi.fn().mockResolvedValue([{ userMessage: "hi" }]),
      summaries: vi.fn().mockResolvedValue([{ period: "最近" }]),
    },
    airjelly: {
      getContext: vi.fn().mockResolvedValue({ source: "mock", events: [], tasks: [], appUsage: [] }),
    },
    hermes: {
      getStatus: vi.fn().mockResolvedValue({ state: "healthy", pid: 1, restartCount: 0, lastError: null, lastStartedAt: null, lastHealthCheckAt: null }),
    },
    tts: {
      getStatus: vi.fn().mockResolvedValue({ provider: "stepfun", configured: true, voiceType: "voice", lastError: null }),
      synthesize: vi.fn().mockResolvedValue({ provider: "stepfun", requestId: "req-1", audioBase64: "AAAA", mimeType: "audio/mpeg", encoding: "mp3", durationMs: null }),
      cancelActive: vi.fn(),
    },
    image: {
      generate: vi.fn().mockResolvedValue({ imageBase64: "BBBB", mimeType: "image/png", savedPath: "/tmp/avatar.png" }),
    },
  };
}

describe("cli router", () => {
  it("routes core capability commands to facade methods", async () => {
    const capabilities = createCapabilities();

    await expect(runCliCommand(["chat", "--user", "user-001", "--character", "char-001", "--message", "你好"], capabilities)).resolves.toMatchObject({ exitCode: 0, json: { text: "收到" } });
    await expect(runCliCommand(["chat", "greet", "--user", "user-001", "--character", "char-001"], capabilities)).resolves.toMatchObject({ exitCode: 0, json: { text: "欢迎回来" } });
    await expect(runCliCommand(["memory", "history", "--user", "user-001", "--limit", "20"], capabilities)).resolves.toMatchObject({ exitCode: 0, json: [{ userMessage: "hi" }] });
    await expect(runCliCommand(["memory", "summaries", "--user", "user-001", "--weeks", "3"], capabilities)).resolves.toMatchObject({ exitCode: 0, json: [{ period: "最近" }] });
    await expect(runCliCommand(["hermes", "status"], capabilities)).resolves.toMatchObject({ exitCode: 0, json: { state: "healthy" } });
    await expect(runCliCommand(["airjelly", "context"], capabilities)).resolves.toMatchObject({ exitCode: 0, json: { source: "mock" } });
    await expect(runCliCommand(["tts", "status"], capabilities)).resolves.toMatchObject({ exitCode: 0, json: { provider: "stepfun" } });
    await expect(runCliCommand(["tts", "synthesize", "--text", "你好"], capabilities)).resolves.toMatchObject({ exitCode: 0, json: { requestId: "req-1" } });
    await expect(runCliCommand(["image", "generate", "--prompt", "avatar"], capabilities)).resolves.toMatchObject({ exitCode: 0, json: { savedPath: "/tmp/avatar.png" } });

    expect(capabilities.chat.sendMessage).toHaveBeenCalledWith({ userId: "user-001", characterId: "char-001", userMessage: "你好" });
    expect(capabilities.chat.getGreeting).toHaveBeenCalledWith({ userId: "user-001", characterId: "char-001" });
    expect(capabilities.memory.history).toHaveBeenCalledWith("user-001", 20);
    expect(capabilities.memory.summaries).toHaveBeenCalledWith("user-001", 3);
    expect(capabilities.hermes.getStatus).toHaveBeenCalled();
    expect(capabilities.airjelly.getContext).toHaveBeenCalled();
    expect(capabilities.tts.getStatus).toHaveBeenCalled();
    expect(capabilities.tts.synthesize).toHaveBeenCalledWith({ text: "你好" });
    expect(capabilities.image.generate).toHaveBeenCalledWith({ prompt: "avatar" });
  });

  it("returns non-zero for missing required arguments", async () => {
    const capabilities = createCapabilities();

    await expect(runCliCommand(["chat", "--user", "user-001"], capabilities)).resolves.toMatchObject({
      exitCode: 1,
      error: expect.stringContaining("--character"),
    });
    await expect(runCliCommand(["memory", "history", "--user", "user-001", "--limit", "oops"], capabilities)).resolves.toMatchObject({
      exitCode: 1,
      error: expect.stringContaining("--limit"),
    });
    await expect(runCliCommand(["tts", "synthesize"], capabilities)).resolves.toMatchObject({
      exitCode: 1,
      error: expect.stringContaining("--text"),
    });
  });

  it("returns non-zero for unknown commands and keeps JSON shape stable", async () => {
    const capabilities = createCapabilities();

    await expect(runCliCommand(["unknown"], capabilities)).resolves.toEqual({
      exitCode: 1,
      json: null,
      error: 'Unknown command: unknown',
    });
  });
});
