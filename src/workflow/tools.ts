import { tool } from "@opencode-ai/plugin/tool"
import type { ToolDefinition } from "@opencode-ai/plugin/tool"

import { createModusContextTool, type ModusFeatureContext } from "../context/harness-context-tool"
import { markPlanTaskComplete, parsePlanFile } from "../state/work-plan"
import { createDelegateTaskTool } from "./delegation-tool"

export type WorkflowToolName = "modus_context" | "read_plan" | "update_progress" | "delegate_task"

export type WorkflowToolContext = ModusFeatureContext

export interface WorkflowToolRegistration {
  readonly name: WorkflowToolName
  readonly description: string
  readonly experimental: boolean
  readonly factory: (context: WorkflowToolContext) => ToolDefinition
}

export type WorkflowToolMap = Record<WorkflowToolName, ToolDefinition>

const readPlanTool = tool({
  description: "Read and parse a Modus work plan file.",
  args: {
    planPath: tool.schema.string().describe("Path to the work plan Markdown file"),
  },
  async execute(args) {
    const plan = await parsePlanFile(args.planPath)
    return {
      output: JSON.stringify(plan, null, 2),
      metadata: {
        planId: plan.metadata.planId,
        title: plan.metadata.title,
        waveCount: plan.waves.length,
        evidencePaths: plan.evidencePaths,
      },
    }
  },
})

const updateProgressTool = tool({
  description: "Mark a task complete in a Modus work plan file.",
  args: {
    planPath: tool.schema.string().describe("Path to the work plan Markdown file"),
    taskId: tool.schema.string().describe("Task checkbox identifier to mark completed"),
    evidenceRefs: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Evidence references to append to the completed task"),
  },
  async execute(args) {
    const plan = await markPlanTaskComplete(args.planPath, args.taskId, {
      evidenceRefs: args.evidenceRefs ?? [],
    })

    return {
      output: `Marked ${args.taskId} complete in ${args.planPath}.`,
      metadata: {
        planId: plan.metadata.planId,
        taskId: args.taskId,
        evidenceRefs: args.evidenceRefs ?? [],
      },
    }
  },
})

export const workflowToolRegistrations: readonly WorkflowToolRegistration[] = [
  {
    name: "modus_context",
    description: "Show the current modus plugin context.",
    experimental: false,
    factory: createModusContextTool,
  },
  {
    name: "read_plan",
    description: "Read and parse a Modus work plan file.",
    experimental: false,
    factory: () => readPlanTool,
  },
  {
    name: "update_progress",
    description: "Mark a task complete in a Modus work plan file.",
    experimental: false,
    factory: () => updateProgressTool,
  },
  {
    name: "delegate_task",
    description: "Delegate a task to a subagent with plan-aware context.",
    experimental: false,
    factory: (context) => createDelegateTaskTool(context.input.client),
  },
]

export function assertUniqueWorkflowToolNames(
  registrations: readonly Pick<WorkflowToolRegistration, "name">[]
): void {
  const seen = new Set<string>()

  for (const registration of registrations) {
    if (seen.has(registration.name)) {
      throw new Error(`Workflow tool already registered: ${registration.name}`)
    }
    seen.add(registration.name)
  }
}

export function createWorkflowTools(context: WorkflowToolContext): WorkflowToolMap {
  assertUniqueWorkflowToolNames(workflowToolRegistrations)

  return Object.fromEntries(
    workflowToolRegistrations.map((registration) => [registration.name, registration.factory(context)])
  ) as WorkflowToolMap
}
