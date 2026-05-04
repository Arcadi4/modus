import { afterEach, describe, expect, it } from "bun:test"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createPluginInterface } from "../plugin-interface"
import {
  assertUniqueWorkflowToolNames,
  createWorkflowTools,
  workflowToolRegistrations,
  type WorkflowToolContext,
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
    expect(tools.update_progress.description).toBe("Update a task's progress in a Modus work plan file.")
    expect(tools.delegate_task.description).toBe("Delegate a task to a subagent with plan-aware context")
  })

  it("keeps plugin interface tool wiring behind the workflow registry", () => {
    const pluginInterface = createPluginInterface(context)

    expect(Object.keys(pluginInterface.tool).sort()).toEqual([...expectedWorkflowTools].sort())
  })
})

describe("read_plan tool", () => {
  const roots: string[] = []

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((path) => rm(path, { recursive: true, force: true })))
  })

  it("returns progress summary with next safe action for partial execution", async () => {
    const root = await mkdtemp(join(tmpdir(), "modus-read-plan-test-"))
    roots.push(root)
    const plansDir = join(root, ".modus/plans")
    await mkdir(plansDir, { recursive: true })

    const planPath = join(plansDir, "partial.md")
    await writeFile(
      planPath,
      `# Plan\n\n**schemaVersion**: 1\n\n## Metadata\n\n- **planId**: partial-plan\n- **title**: Partial Plan\n- **createdAt**: 2026-01-01\n- **draftSource**: test\n\n## Wave 1: First Wave\n\n**Dependencies**: none\n\n### Task 1.1: First Task\n\n#### What to do\n\n- [x] 1.1.1 Completed task\n\n#### Must NOT do\n\n- Do not break\n\n#### References\n\n- ref1\n\n#### Evidence\n\nNO\n\n#### Commit\n\nNO\n\n### Task 1.2: Second Task\n\n#### What to do\n\n- [ ] 1.2.1 Pending task\n\n#### Must NOT do\n\n- Do not break\n\n#### References\n\n- ref2\n\n#### Evidence\n\nYES - Save evidence to .modus/evidence/task-1.2.txt\n\n#### Commit\n\nNO\n\n## Acceptance Criteria\n\n- [ ] AC-1 Complete all tasks\n\n## QA Scenarios\n\n### Scenario 1: Basic test\n\n**Steps**:\n\n1. Do something\n\n**Expected**: Success\n`,
      "utf8",
    )

    const tools = createWorkflowTools({
      ...context,
      input: { ...context.input, worktree: root, directory: root },
    })
    const result = await tools.read_plan.execute({ planPath })
    const output = JSON.parse(result.output as string)

    expect(output.progressSummary).toBeDefined()
    expect(output.progressSummary.totalTasks).toBe(2)
    expect(output.progressSummary.completedTaskCount).toBe(1)
    expect(output.progressSummary.pendingTaskCount).toBe(1)
    expect(output.progressSummary.nextTask).toBeDefined()
    expect(output.progressSummary.nextTask.taskId).toBe("1.2")
    expect(output.progressSummary.nextTask.title).toBe("Second Task")
    expect(output.progressSummary.nextTask.safeAction).toContain("Execute task 1.2")
    expect(output.progressSummary.recoveryMessage).toMatch(/Next safe action/)
    expect(output.progressSummary.recoveryMessage).toMatch(/Do not auto-resume/)
  })
})

describe("update_progress tool", () => {
  it("rejects unsafe paths outside .modus/plans", async () => {
    const tools = createWorkflowTools(context)

    await expect(
      tools.update_progress.execute({
        planPath: "/tmp/evil-plan.md",
        taskId: "1.1.1",
        status: "completed",
        evidencePath: ".modus/evidence/test.txt",
      }),
    ).rejects.toThrow(/Unsafe plan write path rejected/)
  })

  it("rejects unsafe relative paths trying to escape .modus/plans", async () => {
    const tools = createWorkflowTools(context)

    await expect(
      tools.update_progress.execute({
        planPath: ".modus/plans/../../etc/passwd",
        taskId: "1.1.1",
        status: "completed",
        evidencePath: ".modus/evidence/test.txt",
      }),
    ).rejects.toThrow(/Unsafe plan write path rejected/)
  })
})
