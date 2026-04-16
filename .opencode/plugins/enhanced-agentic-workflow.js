const defaultOptions = {
  workflowTag: "enhanced-agentic-workflow",
  blockedCommandPatterns: ["rm -rf /", "mkfs", ":(){ :|:& };:"],
  injectEnv: {},
  extraCompactionContext: [],
  onEvent: undefined,
  shouldBlockCommand: undefined,
  buildCompactionContext: undefined,
}

const mergeOptions = (overrides = {}) => ({
  ...defaultOptions,
  ...overrides,
  blockedCommandPatterns: overrides.blockedCommandPatterns ?? defaultOptions.blockedCommandPatterns,
  injectEnv: overrides.injectEnv ?? defaultOptions.injectEnv,
  extraCompactionContext: overrides.extraCompactionContext ?? defaultOptions.extraCompactionContext,
})

export const createEnhancedAgenticWorkflowPlugin = (pluginOptions = {}) => {
  const options = mergeOptions(pluginOptions)

  return async ({ client, directory, worktree }) => {
    const tryLog = async (level, message, extra = {}) => {
      if (!client?.app?.log) return
      await client.app.log({
        body: {
          service: "enhanced-agentic-workflow",
          level,
          message,
          extra,
        },
      })
    }

    return {
      event: async ({ event }) => {
        if (typeof options.onEvent === "function") {
          await options.onEvent(event, { directory, worktree, client, options })
        }
      },

      "shell.env": async (_input, output) => {
        output.env.OPENCODE_WORKFLOW_TAG = options.workflowTag
        output.env.OPENCODE_WORKTREE = worktree
        output.env.OPENCODE_DIRECTORY = directory

        for (const [key, value] of Object.entries(options.injectEnv)) {
          output.env[key] = String(value)
        }
      },

      "tool.execute.before": async (input) => {
        if (input.tool !== "bash") return

        const command = String(input?.arguments?.command ?? "")

        if (typeof options.shouldBlockCommand === "function") {
          const shouldBlock = await options.shouldBlockCommand(command, input, { directory, worktree, client, options })
          if (shouldBlock) {
            throw new Error("Command blocked by enhanced agentic workflow policy")
          }
          return
        }

        const blocked = options.blockedCommandPatterns.some((pattern) => command.includes(pattern))
        if (blocked) {
          throw new Error("Command blocked by enhanced agentic workflow policy")
        }
      },

      "experimental.session.compacting": async (input, output) => {
        if (typeof options.buildCompactionContext === "function") {
          const customContext = await options.buildCompactionContext(input, { directory, worktree, client, options })
          if (typeof customContext === "string" && customContext.trim().length > 0) {
            output.context.push(customContext)
          }
          return
        }

        const extra = options.extraCompactionContext
          .filter((item) => typeof item === "string" && item.trim().length > 0)
          .map((item) => `- ${item}`)
          .join("\n")

        output.context.push(`\n## Enhanced Agentic Workflow State\n- Workflow tag: ${options.workflowTag}\n- Worktree: ${worktree}\n- Directory: ${directory}${extra ? `\n${extra}` : ""}\n`)
      },

      "session.idle": async () => {
        await tryLog("info", "Session reached idle state", {
          workflowTag: options.workflowTag,
          directory,
          worktree,
        })
      },
    }
  }
}

export const EnhancedAgenticWorkflowPlugin = createEnhancedAgenticWorkflowPlugin()
