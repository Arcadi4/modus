import type { Config } from "@opencode-ai/plugin"

/**
 * Default OpenCode agents to remove when this plugin is injected.
 * OpenCode's agent merge logic (state() function) deletes any agent
 * whose config includes `disable: true`.
 *
 * @see https://opencode.ai/docs/agents#agent-merge — §6.5.1
 */
const DEFAULT_OPENCODE_AGENTS = ["general", "plan", "build", "explore"] as const

export function createConfigHook() {
  return async (config: Config): Promise<void> => {
    if (!config.agent) {
      return
    }

    for (const name of DEFAULT_OPENCODE_AGENTS) {
      const agent = config.agent[name]

      if (agent === undefined) {
        config.agent[name] = { disable: true }
        continue
      }

      if (typeof agent === "object") {
        agent.disable = true
        continue
      }

      config.agent[name] = { disable: true }
    }
  }
}
