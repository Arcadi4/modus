import { describe, expect, it } from "vitest"

import { renderAgentDefinition } from "./renderer"
import type { OpenCodeAgentDescriptor } from "./opencode-adapter"
import type { GeneratedFileMeta } from "./types"

const source: GeneratedFileMeta = {
  hash: "abc123",
  managedMarker: "<!-- MANAGED BY HARNESS -->",
  sourceRole: "tester",
}

const descriptor: OpenCodeAgentDescriptor = {
  id: "arcadia-tester",
  roleId: "role:tester",
  description: "Checks implementation behavior without taking ownership.",
  category: "subagent",
  recommendations: {
    skills: ["manual-frontend-qa"],
    tools: ["read", "bash"],
    guidance: "Keep feedback concise and actionable.",
  },
  source,
}

describe("OpenCode agent renderer markdown contract", () => {
  it("renders YAML frontmatter with description and mode", () => {
    const markdown = renderDescriptor(descriptor)

    expect(markdown.startsWith("---\n")).toBe(true)
    expect(markdown).toContain(
      'description: "Checks implementation behavior without taking ownership."'
    )
    expect(markdown).toContain("mode: subagent")
    expect(markdown).toContain("\n---\n")
  })

  it("renders managed header with source role id and hash", () => {
    const markdown = renderDescriptor(descriptor)

    expect(markdown).toContain("<!-- MANAGED BY HARNESS -->")
    expect(markdown).toContain("role:tester")
    expect(markdown).toContain("abc123")
  })

  it("does not render enforcement language", () => {
    const markdown = renderDescriptor(descriptor)
    const body = markdown.toLowerCase()

    for (const forbidden of ["must", "required", "enforced", "denied", "blocked"]) {
      expect(body).not.toContain(forbidden)
    }
  })
})

function renderDescriptor(value: OpenCodeAgentDescriptor): string {
  return renderAgentDefinition(value as never)
}
