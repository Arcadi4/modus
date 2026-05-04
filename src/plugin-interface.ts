import { createModusContextTool } from "./context/modus-context-tool"
import { createConfigHook } from "./hooks/config"
import { createShellEnvHook } from "./hooks/shell-env"

export function createPluginInterface(context: { input: any; config: any }) {
  return {
    tool: {
      modus_context: createModusContextTool(context),
    },
    config: createConfigHook(),
    ...createShellEnvHook(context),
  }
}
