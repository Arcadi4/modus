import { tool } from "@opencode-ai/plugin/tool"
import type { PluginInput, ToolDefinition } from "@opencode-ai/plugin"
import { delegateTask } from "./delegate-task"
import { DelegationInputSchema } from "./delegation"

export function createDelegateTaskTool(client: PluginInput["client"]): ToolDefinition {
  return tool({
    description: "Delegate a task to a subagent with plan-aware context",
    args: {
      target: tool.schema.string().describe("Target role (e.g., 'explorer', 'programmer-medium')"),
      task: tool.schema.string().describe("Task description"),
      planPath: tool.schema.string().describe("Path to the plan file"),
      taskId: tool.schema.string().describe("Task identifier from plan"),
      taskTitle: tool.schema.string().describe("Human-readable task title"),
      expectedOutcome: tool.schema.string().describe("What success looks like"),
      constraints: tool.schema.array(tool.schema.string()).optional().describe("Must NOT do items"),
      evidencePath: tool.schema.string().describe("Where to save verification evidence"),
      requiredTools: tool.schema.array(tool.schema.string()).optional().describe("Tools needed"),
    },
    async execute(args) {
      const input = DelegationInputSchema.parse({
        target: args.target,
        task: args.task,
        context: {
          planPath: args.planPath,
          taskId: args.taskId,
          taskTitle: args.taskTitle,
          expectedOutcome: args.expectedOutcome,
          constraints: args.constraints || [],
          evidencePath: args.evidencePath,
        },
        requiredTools: args.requiredTools || [],
      })

      const result = await delegateTask(client, input)

      if (!result.success) {
        throw new Error(result.error || "Delegation failed")
      }

      return {
        output: `Task delegated to ${args.target}. Session ID: ${result.sessionId}`,
        metadata: result.metadata,
      }
    },
  })
}
