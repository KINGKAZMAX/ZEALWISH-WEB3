import { formatCliResult, type CliResult } from "./format";

type Capabilities = {
  chat: {
    sendMessage: (payload: { userId: string; characterId: string; userMessage: string }) => Promise<unknown>;
    getGreeting: (payload: { userId: string; characterId: string }) => Promise<unknown>;
  };
  memory: {
    history: (userId: string, limit: number) => Promise<unknown>;
    summaries: (userId: string, weeks: number) => Promise<unknown>;
  };
  airjelly: {
    getContext: () => Promise<unknown>;
  };
  hermes: {
    getStatus: () => Promise<unknown>;
  };
  tts: {
    getStatus: () => Promise<unknown>;
    synthesize: (payload: { text: string }) => Promise<unknown>;
  };
  image: {
    generate: (payload: { prompt: string }) => Promise<unknown>;
  };
};

function readFlag(args: string[], flag: string) {
  const index = args.indexOf(flag);
  if (index < 0 || index + 1 >= args.length) {
    return null;
  }
  return args[index + 1];
}

function requireFlag(args: string[], flag: string) {
  const value = readFlag(args, flag);
  if (!value) {
    throw new Error(`Missing required flag: ${flag}`);
  }
  return value;
}

function parseNumberFlag(args: string[], flag: string) {
  const value = requireFlag(args, flag);
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid numeric flag: ${flag}`);
  }
  return parsed;
}

export async function runCliCommand(argv: string[], capabilities: Capabilities): Promise<CliResult> {
  try {
    const [command, subcommand, ...rest] = argv;

    if (command === "chat") {
      if (subcommand === "greet") {
        const userId = requireFlag(rest, "--user");
        const characterId = requireFlag(rest, "--character");
        return { exitCode: 0, json: await capabilities.chat.getGreeting({ userId, characterId }), error: null };
      }

      const userId = requireFlag(argv, "--user");
      const characterId = requireFlag(argv, "--character");
      const userMessage = requireFlag(argv, "--message");
      return { exitCode: 0, json: await capabilities.chat.sendMessage({ userId, characterId, userMessage }), error: null };
    }

    if (command === "memory") {
      if (subcommand === "history") {
        const userId = requireFlag(rest, "--user");
        const limit = parseNumberFlag(rest, "--limit");
        return { exitCode: 0, json: await capabilities.memory.history(userId, limit), error: null };
      }
      if (subcommand === "summaries") {
        const userId = requireFlag(rest, "--user");
        const weeks = parseNumberFlag(rest, "--weeks");
        return { exitCode: 0, json: await capabilities.memory.summaries(userId, weeks), error: null };
      }
    }

    if (command === "hermes" && subcommand === "status") {
      return { exitCode: 0, json: await capabilities.hermes.getStatus(), error: null };
    }

    if (command === "airjelly" && subcommand === "context") {
      return { exitCode: 0, json: await capabilities.airjelly.getContext(), error: null };
    }

    if (command === "tts") {
      if (subcommand === "status") {
        return { exitCode: 0, json: await capabilities.tts.getStatus(), error: null };
      }
      if (subcommand === "synthesize") {
        const text = requireFlag(rest, "--text");
        return { exitCode: 0, json: await capabilities.tts.synthesize({ text }), error: null };
      }
    }

    if (command === "image" && subcommand === "generate") {
      const prompt = requireFlag(rest, "--prompt");
      return { exitCode: 0, json: await capabilities.image.generate({ prompt }), error: null };
    }

    return { exitCode: 1, json: null, error: `Unknown command: ${command}` };
  } catch (error) {
    return {
      exitCode: 1,
      json: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function formatCliOutput(result: CliResult) {
  return formatCliResult(result);
}
