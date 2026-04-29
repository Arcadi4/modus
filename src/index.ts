import type { Plugin } from "@opencode-ai/plugin"

import { loadConfig } from "./config"
import { createHarnessContextTool } from "./features/harness-context"
import { createShellEnvHook } from "./hooks/shell-env"

export const HarnessPlugin: Plugin = async (input) => {
  const config = loadConfig()
  const context = { input, config }

  return {
    name: "harness-runtime",
    tool: {
      harness_context: createHarnessContextTool(context),
    },
    ...createShellEnvHook(context),
  }
}

export default HarnessPlugin
