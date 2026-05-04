import type { Plugin } from "@opencode-ai/plugin"

import { loadConfig } from "./config/index"
import { createPluginInterface } from "./plugin-interface"

export const ModusPlugin: Plugin = async (input) => {
  const config = loadConfig()
  const context = { input, config }

  return {
    name: "modus",
    ...createPluginInterface(context),
  }
}

export default ModusPlugin
