import { describe, expect, it } from "bun:test"
import {
  EXPECTED_OPENCODE_DESCRIPTOR_COUNT,
  generateOpenCodeDescriptors,
  generateWorkflowAgentDescriptors,
  validateDescriptorCount,
  validateSafeIds,
  verifyDeterministic,
} from "./opencode-adapter"

describe("opencode-adapter", () => {
  it("all descriptor IDs use safe filename characters", () => {
    const descriptors = generateOpenCodeDescriptors()
    const result = validateSafeIds(descriptors)

    expect(result.valid).toBe(true)
    expect(result.unsafeIds).toEqual([])
  })

  it("generates deterministic output across calls", () => {
    const result = verifyDeterministic()
    expect(result).toBe(true)
  })

  it("keeps the generated descriptor count expected by sync consumers", () => {
    const descriptors = generateOpenCodeDescriptors()
    const result = validateDescriptorCount(descriptors)

    expect(result).toEqual({ valid: true, actual: 18, expected: 18 })
    expect(descriptors).toHaveLength(EXPECTED_OPENCODE_DESCRIPTOR_COUNT)
  })

  it("appends prompt-backed workflow descriptors after existing role manifests", () => {
    const descriptors = generateOpenCodeDescriptors()
    const workflowDescriptors = generateWorkflowAgentDescriptors()

    expect(workflowDescriptors.map((descriptor) => descriptor.id)).toEqual([
      "workflow-architect",
      "workflow-planner",
      "workflow-executor",
    ])
    expect(descriptors.slice(-3)).toEqual(workflowDescriptors)
    expect(descriptors.find((descriptor) => descriptor.id === "architect")?.prompt).toBeUndefined()

    expect(workflowDescriptors[0].roleId).toBe("workflow:architect")
    expect(workflowDescriptors[0].prompt?.trim().length).toBeGreaterThan(0)
    expect(workflowDescriptors[1].roleId).toBe("workflow:planner")
    expect(workflowDescriptors[1].prompt?.trim().length).toBeGreaterThan(0)
    expect(workflowDescriptors[2].roleId).toBe("workflow:executor")
    expect(workflowDescriptors[2].prompt?.trim().length).toBeGreaterThan(0)
  })
})
