type FlagEnv = Record<string, string | undefined>;

function readBooleanFlag(env: FlagEnv, key: string, fallback: boolean) {
  const raw = env[key];
  if (!raw || raw === "undefined" || raw === "null") {
    return fallback;
  }

  return !["0", "false", "off", "no"].includes(raw.toLowerCase());
}

export function getMemoryFeatureFlags(env: FlagEnv = process.env) {
  return {
    unifiedMemory: readBooleanFlag(env, "OC_ENABLE_UNIFIED_MEMORY", true),
    distillation: readBooleanFlag(env, "OC_ENABLE_DISTILLATION", true),
    recall: readBooleanFlag(env, "OC_ENABLE_RECALL", true),
    recallPolling: readBooleanFlag(env, "OC_ENABLE_RECALL_POLLING", true),
  };
}
