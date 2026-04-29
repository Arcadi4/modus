import { describe, expect, it } from "bun:test"
import {
  generateOpenCodeDescriptors,
  validateDescriptorCount,
  validateHarnessPrefix,
  validateSafeIds,
  verifyDeterministic,
} from "./opencode-adapter"

describe("opencode-adapter", () => {
  it("generates exactly 15 descriptors", () => {
    const descriptors = generateOpenCodeDescriptors()
    const result = validateDescriptorCount(descriptors)

    expect(result.valid).toBe(true)
    expect(result.actual).toBe(15)
    expect(result.expected).toBe(15)
  })

  it("all descriptors have harness- prefix", () => {
    const descriptors = generateOpenCodeDescriptors()
    const result = validateHarnessPrefix(descriptors)

    expect(result.valid).toBe(true)
    expect(result.invalidIds).toEqual([])
  })

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

  it("descriptor id matches harness-{rolename} format", () => {
    const descriptors = generateOpenCodeDescriptors()
    const ids = descriptors.map((d) => d.id)

    expect(ids).toContain("harness-architect")
    expect(ids).toContain("harness-planner")
    expect(ids).toContain("harness-executor")
    expect(ids).toContain("harness-agile-high")
    expect(ids).toContain("harness-agile-low")
    expect(ids).toContain("harness-introspective")
    expect(ids).toContain("harness-researcher")
    expect(ids).toContain("harness-explorer")
    expect(ids).toContain("harness-programmer-low")
    expect(ids).toContain("harness-programmer-medium")
    expect(ids).toContain("harness-programmer-high")
    expect(ids).toContain("harness-multi-modal-assistant")
    expect(ids).toContain("harness-reviewer")
    expect(ids).toContain("harness-tester")
    expect(ids).toContain("harness-documentation")
  })

  it("includes roleId from original manifest", () => {
    const descriptors = generateOpenCodeDescriptors()
    const architect = descriptors.find((d) => d.id === "harness-architect")

    expect(architect?.roleId).toBe("role:architect")
  })

  it("includes recommendations as metadata, not enforcement", () => {
    const descriptors = generateOpenCodeDescriptors()
    const architect = descriptors.find((d) => d.id === "harness-architect")

    expect(architect?.recommendations).toBeDefined()
    expect(architect?.recommendations?.skills).toContain("brainstorming")
    expect(architect?.recommendations?.tools).toContain("read")
  })

  it("maps correct categories (6 primary, 9 subagent)", () => {
    const descriptors = generateOpenCodeDescriptors()
    const primaries = descriptors.filter((d) => d.category === "primary")
    const subagents = descriptors.filter((d) => d.category === "subagent")

    expect(primaries.length).toBe(6)
    expect(subagents.length).toBe(9)
  })

  it("source includes hash for tracking", () => {
    const descriptors = generateOpenCodeDescriptors()
    const architect = descriptors.find((d) => d.id === "harness-architect")

    expect(architect?.source?.hash).toBeDefined()
    expect(architect?.source?.sourceRole).toBe("architect")
    expect(architect?.source?.managedMarker).toBe("<!-- MANAGED BY HARNESS -->")
  })
})