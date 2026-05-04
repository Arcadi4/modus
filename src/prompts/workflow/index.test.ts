import { describe, expect, it } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  architectWorkflowPrompt,
  plannerWorkflowPrompt,
  PROMPT_ASSET_IMPORT_STRATEGY,
} from "./index"

const GOLDEN_PLAN_PATH = join(process.cwd(), ".modus/plans/example-api-rate-limiting.md")

function readGoldenPlan(): string {
  return readFileSync(GOLDEN_PLAN_PATH, "utf-8")
}

describe("workflow prompt assets", () => {
  it("imports markdown prompts as bundled strings", () => {
    expect(PROMPT_ASSET_IMPORT_STRATEGY).toBe("bun-native-text-import")
    expect(typeof architectWorkflowPrompt).toBe("string")
    expect(architectWorkflowPrompt).toContain("# Architect")
    expect(typeof plannerWorkflowPrompt).toBe("string")
    expect(plannerWorkflowPrompt).toContain("# Planner")
  })
})

describe("Planner prompt self-check criteria", () => {
  it("has Self-Check Criteria section", () => {
    expect(plannerWorkflowPrompt).toContain("## Self-Check Criteria")
  })

  it("has completeness criteria", () => {
    expect(plannerWorkflowPrompt).toContain("### Completeness")
  })

  it("addresses dependencies in criteria", () => {
    expect(plannerWorkflowPrompt).toContain("Dependencies are explicit")
  })

  it("addresses acceptance criteria", () => {
    expect(plannerWorkflowPrompt).toContain("acceptance criteria")
  })

  it("addresses QA scenarios", () => {
    expect(plannerWorkflowPrompt).toContain("QA scenarios cover critical paths")
  })

  it("has scope discipline section", () => {
    expect(plannerWorkflowPrompt).toContain("### Scope Discipline")
  })
})

describe("Golden plan contract", () => {
  let goldenPlan: string

  try {
    goldenPlan = readGoldenPlan()
  } catch {
    goldenPlan = ""
  }

  it("has metadata section", () => {
    expect(goldenPlan).toContain("## Metadata")
  })

  it("has wave sections with tasks", () => {
    expect(goldenPlan).toContain("## Wave 1")
    expect(goldenPlan).toContain("## Wave 2")
  })

  it("has acceptance criteria section", () => {
    expect(goldenPlan).toContain("## Acceptance Criteria")
  })

  it("has QA scenarios section", () => {
    expect(goldenPlan).toContain("## QA Scenarios")
  })

  it("has dependencies specified", () => {
    expect(goldenPlan).toContain("**Dependencies**")
  })

  it("has evidence specified for tasks", () => {
    expect(goldenPlan).toContain("#### Evidence")
  })
})
