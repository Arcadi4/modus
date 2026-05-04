import { createConfigHook } from "./hooks/config"
import { createShellEnvHook } from "./hooks/shell-env"
import { createWorkflowTools } from "./workflow/tools"

export function createPluginInterface(context: { input: any; config: any }) {
  return {
    tool: createWorkflowTools(context),
    config: createConfigHook(),
    ...createShellEnvHook(context),
  }
}
