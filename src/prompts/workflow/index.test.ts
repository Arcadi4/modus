import { describe, expect, it } from "bun:test"

import {
  architectWorkflowPrompt,
  plannerWorkflowPrompt,
  PROMPT_ASSET_IMPORT_STRATEGY,
} from "./index"

describe("workflow prompt assets", () => {
  it("imports markdown prompts as bundled strings", () => {
    expect(PROMPT_ASSET_IMPORT_STRATEGY).toBe("bun-native-text-import")
    expect(typeof architectWorkflowPrompt).toBe("string")
    expect(architectWorkflowPrompt).toContain("# Architect")
    expect(typeof plannerWorkflowPrompt).toBe("string")
    expect(plannerWorkflowPrompt).toContain("# Planner")
  })
})
