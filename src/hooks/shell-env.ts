import type { PluginInput } from "@opencode-ai/plugin"

import type { ModusPluginConfig } from "../config"

export type ShellEnvHookContext = {
  input: PluginInput
  config: ModusPluginConfig
}

export function createShellEnvHook(context: ShellEnvHookContext) {
  return {
    "shell.env": async (
      _input: { cwd: string; sessionID?: string; callID?: string },
      output: { env: Record<string, string> }
    ) => {
      output.env[`${context.config.envPrefix}_PROJECT_ID`] = context.input.project.id
      output.env[`${context.config.envPrefix}_PROJECT_ROOT`] = context.input.directory
      output.env[`${context.config.envPrefix}_WORKTREE`] = context.input.worktree
    },
  }
}
