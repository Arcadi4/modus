import { createHarnessContextTool } from "./context/harness-context-tool"
import { createConfigHook } from "./hooks/config"
import { createShellEnvHook } from "./hooks/shell-env"

export function createPluginInterface(context: { input: any; config: any }) {
  return {
    tool: {
      harness_context: createHarnessContextTool(context),
    },
    config: createConfigHook(),
    ...createShellEnvHook(context),
  }
}
