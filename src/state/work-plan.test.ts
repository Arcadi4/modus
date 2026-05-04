import { afterEach, describe, expect, it } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  markPlanTaskComplete,
  parsePlanFile,
  parsePlanMarkdown,
  PLAN_MAX_BYTES,
  PlanParseError,
  PlanUpdateConflictError,
} from "./work-plan"

const goldenPlanPath = join(import.meta.dir, "../../.modus/plans/example-api-rate-limiting.md")
const tempRoots: string[] = []

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

describe("plan parser", () => {
  it("reads the golden plan into structured waves and tasks", async () => {
    const plan = await parsePlanFile(goldenPlanPath)

    expect(plan.schemaVersion).toBe(1)
    expect(plan.metadata.planId).toBe("plan-api-rate-limiting")
    expect(plan.waves).toHaveLength(2)
    expect(plan.waves[0].waveId).toBe(1)
    expect(plan.waves[0].description).toBe("Core Infrastructure")
    expect(plan.waves[0].tasks).toHaveLength(2)
    expect(plan.waves[0].tasks[0].taskId).toBe("1.1")
    expect(plan.waves[0].tasks[0].mustDo[0]).toMatchObject({
      taskId: "1.1.1",
      status: "pending",
      title: "Create `src/middleware/rate-limit.ts` with Redis-backed counter logic",
    })
    expect(plan.waves[1].dependencies).toEqual(["Wave 1"])
    expect(plan.acceptanceCriteria).toHaveLength(8)
    expect(plan.qaScenarios[0]).toMatchObject({
      scenario: "Anonymous user exceeds limit",
      expectedOutcome: "101st request returns 429 with Retry-After header",
    })
    expect(plan.evidencePaths).toContain(".modus/evidence/task-1.1-middleware-tests.txt")
  })

  it("rejects malformed plans with actionable errors", () => {
    expect(() => parsePlanMarkdown("# Plan\n\n**schemaVersion**: 1\n")).toThrow(PlanParseError)
    expect(() => parsePlanMarkdown("# Plan\n\n**schemaVersion**: 1\n")).toThrow(
      "Missing required section marker `## Metadata`.",
    )
  })

  it("enforces MVP size limits gracefully", () => {
    expect(() => parsePlanMarkdown("#".repeat(PLAN_MAX_BYTES + 1))).toThrow("Plan exceeds MVP limit")
  })
})

describe("plan progress updates", () => {
  it("marks a checkbox complete and attaches evidence refs", async () => {
    const filePath = await copyGoldenPlan()

    const plan = await markPlanTaskComplete(filePath, "1.1.1", {
      evidenceRefs: [".modus/evidence/task-7-plan-parse-update.txt"],
      now: new Date("2026-05-04T17:00:00.000Z"),
    })
    const updated = await readFile(filePath, "utf8")

    expect(updated).toContain(
      "- [x] 1.1.1 Create `src/middleware/rate-limit.ts` with Redis-backed counter logic — Evidence: `.modus/evidence/task-7-plan-parse-update.txt`",
    )
    expect(updated).toContain(
      "- Completed 2026-05-04T17:00:00.000Z: `.modus/evidence/task-7-plan-parse-update.txt`",
    )
    expect(plan.waves[0].tasks[0].mustDo[0].status).toBe("completed")
    expect(plan.waves[0].tasks[0].mustDo[0].evidenceRefs).toEqual([
      ".modus/evidence/task-7-plan-parse-update.txt",
    ])
  })

  it("detects concurrent updates and leaves valid markdown behind", async () => {
    const filePath = await copyGoldenPlan()

    const [first, second] = await Promise.allSettled([
      markPlanTaskComplete(filePath, "1.1.1", {
        evidenceRefs: [".modus/evidence/task-7-concurrent-progress-a.txt"],
      }),
      markPlanTaskComplete(filePath, "1.1.2", {
        evidenceRefs: [".modus/evidence/task-7-concurrent-progress-b.txt"],
      }),
    ])

    const rejected = [first, second].filter((result) => result.status === "rejected")
    expect(rejected).toHaveLength(1)
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(PlanUpdateConflictError)

    const reparsed = await parsePlanFile(filePath)
    const completedCount = reparsed.waves[0].tasks[0].mustDo.filter(
      (task) => task.status === "completed",
    ).length
    expect(completedCount).toBe(1)
  })
})

async function copyGoldenPlan(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "modus-plan-test-"))
  tempRoots.push(root)
  const plans = join(root, ".modus/plans")
  await mkdir(plans, { recursive: true })
  const filePath = join(plans, "example.md")
  await writeFile(filePath, await readFile(goldenPlanPath, "utf8"), "utf8")
  return filePath
}
