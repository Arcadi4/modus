import { describe, expect, it, mock } from "bun:test"
import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { createConfigHook } from "../hooks/config"
import { createWorkflowTools, type WorkflowToolContext } from "./tools"
import { parsePlanFile } from "../state/work-plan"
import { generateOpenCodeDescriptors } from "../opencode/opencode-adapter"

describe("golden workflow smoke test", () => {
  it("verifies end-to-end workflow without live model calls", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "modus-smoke-"))
    const plansDir = join(tmpDir, ".modus", "plans")
    const evidenceDir = join(tmpDir, ".modus", "evidence")

    await Bun.write(join(plansDir, "test-plan.md"), await readFile(".modus/plans/example-api-rate-limiting.md"))
    await Bun.write(join(evidenceDir, ".gitkeep"), "")

    const context: WorkflowToolContext = {
      input: {
        project: { id: "smoke-test" },
        directory: tmpDir,
        worktree: tmpDir,
        client: mock(() => {}),
      },
      config: { envPrefix: "MODUS_" },
    }

    // 1. Verify agent descriptors generate correctly
    const descriptors = generateOpenCodeDescriptors()
    expect(descriptors.length).toBe(18)
    expect(descriptors.find((d) => d.id === "workflow-executor")).toBeDefined()
    expect(descriptors.find((d) => d.id === "workflow-planner")).toBeDefined()
    expect(descriptors.find((d) => d.id === "workflow-architect")).toBeDefined()

    // 2. Verify config hook registers /exec command
    const config: any = {}
    await createConfigHook()(config)
    expect(config.command?.exec).toMatchObject({
      agent: "executor",
      description: expect.stringContaining("Execute a Modus plan"),
    })

    // 3. Verify tool registry constructs correctly
    const tools = createWorkflowTools(context)
    expect(tools.read_plan).toBeDefined()
    expect(tools.update_progress).toBeDefined()
    expect(tools.delegate_task).toBeDefined()

    // 4. Verify plan parsing works with golden fixture
    const planPath = join(plansDir, "test-plan.md")
    const plan = await parsePlanFile(planPath)
    expect(plan.metadata.planId).toBe("plan-api-rate-limiting")
    expect(plan.waves.length).toBe(2)
    expect(plan.waves[0]?.tasks.length).toBe(2)

    // 5. Verify read_plan tool execution
    const readResult = await tools.read_plan.execute({ planPath })
    expect(readResult.metadata?.planId).toBe("plan-api-rate-limiting")
    expect(readResult.metadata?.waveCount).toBe(2)

    // 6. Verify update_progress tool marks task complete
    const updateResult = await tools.update_progress.execute({
      planPath,
      taskId: "1.1.1",
      status: "completed",
      evidencePath: ".modus/evidence/task-1.1-test.txt",
      note: "Smoke test verification",
    })
    expect(updateResult.metadata?.taskId).toBe("1.1.1")
    expect(updateResult.metadata?.status).toBe("completed")

    // 7. Verify plan file was updated with evidence
    const updatedPlan = await parsePlanFile(planPath)
    const task = updatedPlan.waves[0]?.tasks[0]
    expect(task?.mustDo[0]?.status).toBe("completed")
    expect(task?.evidenceRefs).toContain(".modus/evidence/task-1.1-test.txt")
  })

  it("verifies executor context construction without model calls", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "modus-exec-"))
    const plansDir = join(tmpDir, ".modus", "plans")

    await Bun.write(join(plansDir, "test-plan.md"), await readFile(".modus/plans/example-api-rate-limiting.md"))

    const context: WorkflowToolContext = {
      input: {
        project: { id: "exec-test" },
        directory: tmpDir,
        worktree: tmpDir,
        client: mock(() => {}),
      },
      config: { envPrefix: "MODUS_" },
    }

    const tools = createWorkflowTools(context)
    const planPath = join(plansDir, "test-plan.md")

    // Simulate executor reading plan
    const readResult = await tools.read_plan.execute({ planPath })
    const summary = JSON.parse(readResult.output)

    expect(summary.metadata.title).toBe("API Rate Limiting Implementation")
    expect(summary.waves[0].tasks[0].taskId).toBe("1.1")
    expect(summary.waves[0].tasks[0].mustDo).toHaveLength(4)
    expect(summary.acceptanceCriteria).toHaveLength(8)
    expect(summary.qaScenarios).toHaveLength(4)
  })
})
