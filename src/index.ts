import type { Plugin } from "@opencode-ai/plugin"

import { loadConfig } from "./config"
import { createHarnessContextTool } from "./features/harness-context"
import { createConfigHook } from "./hooks/config"
import { createShellEnvHook } from "./hooks/shell-env"

export const HarnessPlugin: Plugin = async (input) => {
  const config = loadConfig()
  const context = { input, config }

  return {
    name: "harness-runtime",
    tool: {
      harness_context: createHarnessContextTool(context),
    },
    config: createConfigHook(),
    ...createShellEnvHook(context),
  }
}

export default HarnessPlugin
