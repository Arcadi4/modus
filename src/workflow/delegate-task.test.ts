import { describe, expect, it } from "bun:test"
import type { PluginInput } from "@opencode-ai/plugin"
import { delegateTask } from "./delegate-task"
import type { DelegationInput } from "./delegation"

const mockClient: PluginInput["client"] = {
  session: {
    create: async () => ({ data: { id: "test-session-123" }, error: undefined } as any),
    prompt: async () => ({ data: {}, error: undefined } as any),
  },
} as any

describe("delegateTask", () => {
  it("constructs delegation context with all required fields", async () => {
    const input: DelegationInput = {
      target: "explorer",
      task: "Find authentication patterns",
      context: {
        planPath: ".modus/plans/test-plan.md",
        taskId: "T1",
        taskTitle: "Explore auth patterns",
        expectedOutcome: "List of auth files and patterns",
        constraints: ["Do not modify files", "Do not run tests"],
        evidencePath: ".modus/evidence/task-1-exploration.txt",
      },
      requiredTools: ["read", "grep"],
    }

    const result = await delegateTask(mockClient, input)

    expect(result.success).toBe(true)
    expect(result.sessionId).toBe("test-session-123")
    expect(result.metadata?.taskId).toBe("T1")
  })

  it("returns actionable error for invalid target role", async () => {
    const input = {
      target: "invalid-role",
      task: "Do something",
      context: {
        planPath: ".modus/plans/test.md",
        taskId: "T1",
        taskTitle: "Test",
        expectedOutcome: "Done",
        constraints: [],
        evidencePath: ".modus/evidence/test.txt",
      },
      requiredTools: [],
    }

    const result = await delegateTask(mockClient, input as any)

    expect(result.success).toBe(false)
    expect(result.error).toContain("Invalid delegation input")
    expect(result.error).toContain("Invalid option")
  })
})
