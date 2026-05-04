import { tool } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"

import type { ModusPluginConfig } from "../config"

export type ModusFeatureContext = {
  input: PluginInput
  config: ModusPluginConfig
}

export function renderModusContext(context: ModusFeatureContext): string {
  return [
    "# Modus Context",
    "",
    `Project ID: ${context.input.project.id}`,
    `Project Root: ${context.input.directory}`,
    `Worktree: ${context.input.worktree}`,
    `Env Prefix: ${context.config.envPrefix}`,
  ].join("\n")
}

export function createModusContextTool(context: ModusFeatureContext) {
  return tool({
    description: "Show the current modus plugin context.",
    args: {},
    async execute() {
      return renderModusContext(context)
    },
  })
}
