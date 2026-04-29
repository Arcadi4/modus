import { tool } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"

import type { HarnessPluginConfig } from "../config"

export type HarnessFeatureContext = {
  input: PluginInput
  config: HarnessPluginConfig
}

export function renderHarnessContext(context: HarnessFeatureContext): string {
  return [
    "# Harness Context",
    "",
    `Project ID: ${context.input.project.id}`,
    `Project Root: ${context.input.directory}`,
    `Worktree: ${context.input.worktree}`,
    `Env Prefix: ${context.config.envPrefix}`,
  ].join("\n")
}

export function createHarnessContextTool(context: HarnessFeatureContext) {
  return tool({
    description: "Show the current harness plugin context.",
    args: {},
    async execute() {
      return renderHarnessContext(context)
    },
  })
}
