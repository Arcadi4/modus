import { z } from "zod"

/**
 * Task delegation wrapper contract for plan-aware task execution.
 * Thin wrapper around OpenCode session delegation with structured context.
 */

export const DelegationTargetSchema = z.enum([
  "researcher",
  "explorer",
  "programmer-low",
  "programmer-medium",
  "programmer-high",
  "multi-modal-assistant",
  "reviewer",
  "tester",
  "documentation",
])

export const DelegationContextSchema = z.object({
  planPath: z.string().describe("Path to the plan file"),
  taskId: z.string().describe("Task identifier from plan"),
  taskTitle: z.string().describe("Human-readable task title"),
  expectedOutcome: z.string().describe("What success looks like"),
  constraints: z.array(z.string()).default([]).describe("Must NOT do items"),
  evidencePath: z.string().describe("Where to save verification evidence"),
})

export const DelegationInputSchema = z.object({
  target: DelegationTargetSchema,
  task: z.string().describe("Task description"),
  context: DelegationContextSchema,
  requiredTools: z.array(z.string()).default([]).describe("Tools the agent needs"),
})

export const DelegationResultSchema = z.object({
  success: z.boolean(),
  sessionId: z.string().optional(),
  error: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export type DelegationTarget = z.infer<typeof DelegationTargetSchema>
export type DelegationContext = z.infer<typeof DelegationContextSchema>
export type DelegationInput = z.infer<typeof DelegationInputSchema>
export type DelegationResult = z.infer<typeof DelegationResultSchema>
