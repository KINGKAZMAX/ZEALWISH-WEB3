import { createOcWorldCapabilities } from "../electron/capabilities/facade";
import { getAirJellyContext } from "../electron/services/airjelly";
import { chat, generateGreeting } from "../electron/services/chat-engine";
import { hermesManager } from "../electron/services/hermes-manager";
import { generateImage } from "../electron/services/image-gen";
import { loadOCHistory, loadRecentSummaries } from "../electron/services/memory";
import { getTtsStatus, synthesizeSpeech } from "../electron/services/tts";
import { formatCliOutput, runCliCommand } from "./router";

async function main() {
  const capabilities = createOcWorldCapabilities({
    services: {
      chat,
      generateGreeting,
      loadOCHistory,
      loadRecentSummaries,
      getAirJellyContext,
      hermesManager,
      getTtsStatus,
      synthesizeSpeech,
      generateImage,
    },
  });

  const result = await runCliCommand(process.argv.slice(2), capabilities);
  if (result.json !== null) {
    process.stdout.write(`${formatCliOutput(result)}\n`);
  }
  if (result.error) {
    process.stderr.write(`${result.error}\n`);
  }
  process.exitCode = result.exitCode;
}

void main();
