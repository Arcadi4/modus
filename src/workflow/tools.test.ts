import { describe, expect, it } from "bun:test"

import { createPluginInterface } from "../plugin-interface"
import {
  assertUniqueWorkflowToolNames,
  createWorkflowTools,
  workflowToolRegistrations,
  type WorkflowToolContext,
  type WorkflowToolName,
} from "./tools"

const context = {
  input: {
    project: { id: "test-project" },
    directory: "/tmp/modus",
    worktree: "/tmp/modus",
  },
  config: {
    envPrefix: "MODUS_",
  },
} as WorkflowToolContext

const expectedWorkflowTools: readonly WorkflowToolName[] = [
  "modus_context",
  "read_plan",
  "update_progress",
  "delegate_task",
]

describe("workflow tool registry", () => {
  it("registers expected workflow tools by unique name", () => {
    const names = workflowToolRegistrations.map((registration) => registration.name)

    expect(names).toEqual(expectedWorkflowTools)
    expect(new Set(names).size).toBe(names.length)
  })

  it("rejects duplicate workflow tool names", () => {
    expect(() =>
      assertUniqueWorkflowToolNames([
        { name: "read_plan" },
        { name: "read_plan" },
      ])
    ).toThrow("Workflow tool already registered: read_plan")
  })

  it("constructs all workflow tools from registry factories", () => {
    const tools = createWorkflowTools(context)

    expect(Object.keys(tools)).toEqual(expectedWorkflowTools)
    expect(tools.modus_context.description).toBe("Show the current modus plugin context.")
    expect(tools.read_plan.description).toBe("Read and parse a Modus work plan file.")
    expect(tools.update_progress.description).toBe("Mark a task complete in a Modus work plan file.")
    expect(tools.delegate_task.description).toBe("Delegate a task to a subagent with plan-aware context")
  })

  it("keeps plugin interface tool wiring behind the workflow registry", () => {
    const pluginInterface = createPluginInterface(context)

    expect(Object.keys(pluginInterface.tool).sort()).toEqual([...expectedWorkflowTools].sort())
  })
})
