import { tool } from "@opencode-ai/plugin/tool"
import type { ToolDefinition } from "@opencode-ai/plugin/tool"
import { readdir } from "node:fs/promises"
import { join, relative, resolve } from "node:path"

import { createModusContextTool, type ModusFeatureContext } from "../context/harness-context-tool"
import { markPlanTaskComplete, parsePlanFile, type ParsedPlan } from "../state/work-plan"
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

const PLAN_DIRECTORY = ".modus/plans"

function createReadPlanTool(context: WorkflowToolContext): ToolDefinition {
  return tool({
    description: "Read and parse a Modus work plan file.",
    args: {
      planPath: tool.schema.string().optional().describe("Path to the work plan Markdown file"),
    },
    async execute(args) {
      const planPath = await resolvePlanPath(context, args.planPath)
      const plan = await parsePlanFile(planPath)
      const summary = summarizePlan(plan)

      return {
        output: JSON.stringify(summary, null, 2),
        metadata: {
          planPath,
          planId: plan.metadata.planId,
          title: plan.metadata.title,
          waveCount: plan.waves.length,
          evidencePaths: plan.evidencePaths,
        },
      }
    },
  })
}

function createUpdateProgressTool(context: WorkflowToolContext): ToolDefinition {
  return tool({
    description: "Update a task's progress in a Modus work plan file.",
    args: {
      planPath: tool.schema.string().describe("Path to the work plan Markdown file under .modus/plans"),
      taskId: tool.schema.string().describe("Task checkbox identifier to update"),
      status: tool.schema.string().describe("Task status to write; currently supports 'completed'"),
      evidencePath: tool.schema.string().describe("Evidence path to attach to the task"),
      note: tool.schema.string().optional().describe("Optional progress note to append with evidence"),
    },
    async execute(args) {
      if (args.status !== "completed") {
        throw new Error("update_progress currently supports only status 'completed'.")
      }

      const planPath = await resolvePlanPath(context, args.planPath)
      assertPlanWritePath(context, planPath)
      const plan = await markPlanTaskComplete(planPath, args.taskId, {
        evidenceRefs: [args.evidencePath],
        note: args.note,
      })

      return {
        output: `Marked ${args.taskId} ${args.status} in ${planPath}.`,
        metadata: {
          planPath,
          planId: plan.metadata.planId,
          taskId: args.taskId,
          status: args.status,
          evidencePath: args.evidencePath,
          note: args.note,
        },
      }
    },
  })
}

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
    factory: createReadPlanTool,
  },
  {
    name: "update_progress",
    description: "Update a task's progress in a Modus work plan file.",
    experimental: false,
    factory: createUpdateProgressTool,
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

async function resolvePlanPath(context: WorkflowToolContext, planPath?: string): Promise<string> {
  if (planPath?.trim()) {
    return resolveWorkspacePath(context, planPath)
  }

  const plansDirectory = plansRoot(context)
  const plans = (await readdir(plansDirectory)).filter((entry) => entry.endsWith(".md"))
  if (plans.length !== 1) {
    throw new Error(
      `Unable to resolve default plan path; expected exactly one Markdown file in ${PLAN_DIRECTORY}, found ${plans.length}.`,
    )
  }
  return join(plansDirectory, plans[0] ?? "")
}

function resolveWorkspacePath(context: WorkflowToolContext, candidate: string): string {
  return resolve(workspaceRoot(context), candidate)
}

function assertPlanWritePath(context: WorkflowToolContext, planPath: string): void {
  const root = plansRoot(context)
  const relativePath = relative(root, planPath)
  if (relativePath.startsWith("..") || relativePath === "" || resolve(root, relativePath) !== planPath) {
    throw new Error(`Unsafe plan write path rejected: ${planPath}. Writes are limited to ${PLAN_DIRECTORY}.`)
  }
}

function plansRoot(context: WorkflowToolContext): string {
  return join(workspaceRoot(context), PLAN_DIRECTORY)
}

function workspaceRoot(context: WorkflowToolContext): string {
  return resolve(context.input.worktree || context.input.directory)
}

function summarizePlan(plan: ParsedPlan) {
  const allTasks = plan.waves.flatMap((wave) =>
    wave.tasks.map((task) => ({
      waveId: wave.waveId,
      ...task,
      mustDoStatus: summarizeTaskStatus(task.mustDo),
    }))
  )
  const completedTasks = allTasks.filter((task) => task.mustDoStatus === "completed")
  const pendingTasks = allTasks.filter((task) => task.mustDoStatus === "pending")
  const nextTask = pendingTasks[0]

  return {
    schemaVersion: plan.schemaVersion,
    metadata: plan.metadata,
    waves: plan.waves.map((wave) => ({
      waveId: wave.waveId,
      description: wave.description,
      dependencies: wave.dependencies,
      taskCount: wave.tasks.length,
      tasks: wave.tasks.map((task) => ({
        taskId: task.taskId,
        title: task.title,
        status: summarizeTaskStatus(task.mustDo),
        evidenceRequired: task.evidenceRequired,
        evidenceRefs: task.evidenceRefs,
        mustDo: task.mustDo,
        mustNotDo: task.mustNotDo,
        references: task.references,
        commitRequired: task.commitRequired,
        commitMessage: task.commitMessage,
      })),
    })),
    acceptanceCriteria: plan.acceptanceCriteria,
    qaScenarios: plan.qaScenarios,
    evidencePaths: plan.evidencePaths,
    progressSummary: {
      totalTasks: allTasks.length,
      completedTaskCount: completedTasks.length,
      pendingTaskCount: pendingTasks.length,
      nextTask: nextTask
        ? {
            taskId: nextTask.taskId,
            title: nextTask.title,
            waveId: nextTask.waveId,
            safeAction: `Execute task ${nextTask.taskId} ("${nextTask.title}") from Wave ${nextTask.waveId}.`,
          }
        : null,
      recoveryMessage:
        pendingTasks.length > 0
          ? `Plan has ${completedTasks.length} completed task(s) and ${pendingTasks.length} pending task(s). Next safe action: execute task ${nextTask?.taskId} ("${nextTask?.title}"). Do not auto-resume; verify task state before continuing.`
          : `Plan appears complete (${completedTasks.length}/${allTasks.length} tasks done). Verify all evidence before marking plan execution finished.`,
    },
  }
}

function summarizeTaskStatus(tasks: ParsedPlan["acceptanceCriteria"]): "pending" | "completed" {
  return tasks.every((task) => task.status === "completed") ? "completed" : "pending"
}
