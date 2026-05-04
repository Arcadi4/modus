import type { PluginInput } from "@opencode-ai/plugin"
import {
  DelegationInputSchema,
  type DelegationInput,
  type DelegationResult,
  type DelegationTarget,
} from "./delegation"

const VALID_TARGETS: readonly DelegationTarget[] = [
  "researcher",
  "explorer",
  "programmer-low",
  "programmer-medium",
  "programmer-high",
  "multi-modal-assistant",
  "reviewer",
  "tester",
  "documentation",
]

function buildDelegationPrompt(input: DelegationInput): string {
  const { task, context, requiredTools } = input

  const sections = [
    `**Task:** ${task}`,
    `**Expected Outcome:** ${context.expectedOutcome}`,
  ]

  if (requiredTools.length > 0) {
    sections.push(`**Required Tools:** ${requiredTools.join(", ")}`)
  }

  if (context.constraints.length > 0) {
    sections.push(`**Must NOT do:**\n${context.constraints.map((c) => `- ${c}`).join("\n")}`)
  }

  sections.push(
    `**Context:**`,
    `- Plan: ${context.planPath}`,
    `- Task ID: ${context.taskId}`,
    `- Task Title: ${context.taskTitle}`,
    ``,
    `**Evidence Path:** ${context.evidencePath}`,
    `Save verification evidence to this path when complete.`
  )

  return sections.join("\n\n")
}

export async function delegateTask(
  client: PluginInput["client"],
  input: DelegationInput
): Promise<DelegationResult> {
  const parsedInput = DelegationInputSchema.safeParse(input)
  if (!parsedInput.success) {
    return {
      success: false,
      error: `Invalid delegation input: ${parsedInput.error.issues.map((issue) => issue.message).join("; ")}`,
      metadata: {},
    }
  }

  const parsed = parsedInput.data

  if (!VALID_TARGETS.includes(parsed.target)) {
    return {
      success: false,
      error: `Invalid target role: ${parsed.target}. Valid targets: ${VALID_TARGETS.join(", ")}`,
      metadata: {},
    }
  }

  try {
    const prompt = buildDelegationPrompt(parsed)
    const result = await client.session.create({
      body: {
        title: `${parsed.target}: ${parsed.context.taskTitle}`,
      },
    })

    if (result.error) {
      return {
        success: false,
        error: String(result.error),
        metadata: {},
      }
    }

    const sessionId = result.data.id

    await client.session.prompt({
      body: {
        agent: parsed.target,
        parts: [{ type: "text", text: prompt }],
      },
      path: { id: sessionId },
    })

    return {
      success: true,
      sessionId,
      metadata: {
        target: parsed.target,
        taskId: parsed.context.taskId,
        planPath: parsed.context.planPath,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      metadata: {},
    }
  }
}
