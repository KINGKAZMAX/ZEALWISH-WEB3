import { ensureHermesAgentSource } from "./hermes-agent-source.mjs";

const result = ensureHermesAgentSource();

if (result.cloned) {
  console.log(`Downloaded hermes-agent from ${result.repo}#${result.ref}`);
} else {
  console.log(`Using hermes-agent at ${result.hermesRoot}`);
}
