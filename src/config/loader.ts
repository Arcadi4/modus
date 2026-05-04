import type { ModusPluginConfig } from "./schema"
import { ModusPluginConfigSchema } from "./schema"

export function loadConfig(): ModusPluginConfig {
  const parsed = ModusPluginConfigSchema.parse({})
  return {
    ...parsed,
    modelCapabilities: parsed.modelCapabilities ?? {
      supportsStreaming: false,
      supportsTools: false,
      supportsVision: false,
      supportsJsonMode: false,
    },
  }
}
