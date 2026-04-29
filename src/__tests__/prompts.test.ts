import { describe, expect, it } from "vitest"
import {
  buildDirective,
  buildPrompt,
  buildPromptSections,
  buildReminder,
  executionPrompt,
  planningPrompt,
} from "../prompts"

describe("prompt builder", () => {
  it("renders planning prompts deterministically", () => {
    const first = buildPrompt(planningPrompt)
    const second = buildPrompt(planningPrompt)

    expect(second).toBe(first)
    expect(first).toBe(`[METADATA]
Role: planner
Intent: turn a single approved goal into small verifiable steps

[CONSTRAINTS]
- keep the plan scoped to one outcome
- name dependencies before implementation details
- avoid runtime behavior not requested by the goal

[FORMAT]
- use short sections
- prefer numbered steps when order matters
- include explicit verification commands

[CONTENT]
Objective: produce a lean plan that another role can execute without extra context
Process:
- state assumptions that affect scope
- split work by stable file or module boundary
- attach a concrete check to each deliverable
Output:
- one task list
- known risks
- verification sequence`)
  })

  it("keeps metadata separate from content sections", () => {
    const sections = buildPromptSections(executionPrompt)

    expect(sections.map((section) => section.marker)).toEqual([
      "metadata",
      "constraints",
      "format",
      "content",
    ])
    expect(sections.filter((section) => section.kind === "metadata")).toHaveLength(3)
    expect(sections.at(-1)?.kind).toBe("content")
  })

  it("renders short directive and reminder helpers", () => {
    expect(buildDirective({ marker: "directive", text: "Use the smallest useful context." })).toBe(
      "[DIRECTIVE]\nUse the smallest useful context."
    )
    expect(buildReminder({ marker: "reminder", text: "Verify before reporting completion." })).toBe(
      "[REMINDER]\nVerify before reporting completion."
    )
  })
})
