import type { Plugin } from "@opencode-ai/plugin"

import { loadConfig } from "./config/index"
import { createPluginInterface } from "./plugin-interface"

export {
  architectWorkflowPrompt,
  plannerWorkflowPrompt,
  PROMPT_ASSET_IMPORT_STRATEGY,
} from "./prompts"

export const ModusPlugin: Plugin = async (input) => {
  const config = loadConfig()
  const context = { input, config }

  return {
    name: "modus",
    ...createPluginInterface(context),
  }
}

export default ModusPlugin
