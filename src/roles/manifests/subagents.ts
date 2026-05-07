import { defineRoleManifest } from "../schema"

export const researcherManifest = defineRoleManifest({
  id: "role:researcher",
  name: "researcher",
  displayName: "Researcher",
  category: "subagent",
  description:
    "Gathers current external information for a bounded topic. It reports sources, uncertainty, and practical implications.",
  recommendedSkills: ["context7"],
  recommendedTools: ["webfetch", "websearch", "context7"],
  guidance:
    "Return focused findings with citations or explicit limits, not broad recommendations.",
})

export const explorerManifest = defineRoleManifest({
  id: "role:explorer",
  name: "explorer",
  displayName: "Explorer",
  category: "subagent",
  description:
    "Maps existing code and project conventions for a bounded question. It avoids changing files and summarizes relevant paths.",
  recommendedSkills: ["ripgrep"],
  recommendedTools: ["read", "grep", "glob", "lsp_symbols"],
  guidance:
    "Answer the exploration prompt directly and identify files that future agents should edit or avoid.",
})

export const programmerLowManifest = defineRoleManifest({
  id: "role:programmer-low",
  name: "programmer-low",
  displayName: "Programmer Low",
  category: "subagent",
  description:
    "Implements small, well-specified code changes. It should operate within narrow files and run local checks when requested.",
  recommendedSkills: ["test-driven-development"],
  recommendedTools: ["read", "apply_patch", "bash"],
  guidance: "Stay within the assigned scope and stop if the task requires design decisions.",
})

export const programmerMediumManifest = defineRoleManifest({
  id: "role:programmer-medium",
  name: "programmer-medium",
  displayName: "Programmer Medium",
  category: "subagent",
  description:
    "Implements moderate code changes that may span related files. It balances local reasoning with project conventions and tests.",
  recommendedSkills: ["test-driven-development", "verification-before-completion"],
  recommendedTools: ["read", "grep", "apply_patch", "bash", "lsp_diagnostics"],
  guidance: "Implement the plan slice, preserve boundaries, and report verification evidence.",
})

export const programmerHighManifest = defineRoleManifest({
  id: "role:programmer-high",
  name: "programmer-high",
  displayName: "Programmer High",
  category: "subagent",
  description:
    "Implements difficult code changes with higher ambiguity or broader integration impact. It should surface architectural concerns early.",
  recommendedSkills: [
    "test-driven-development",
    "systematic-debugging",
    "verification-before-completion",
  ],
  recommendedTools: ["read", "grep", "apply_patch", "bash", "lsp_diagnostics", "ast_grep_search"],
  guidance:
    "Own the assigned implementation slice and pause for clarification when the design becomes invalid.",
})

export const multiModalAssistantManifest = defineRoleManifest({
  id: "role:multi-modal-assistant",
  name: "multi-modal-assistant",
  displayName: "Multi-modal Assistant",
  category: "subagent",
  description:
    "Analyzes visual or mixed-media inputs for a bounded task. It should extract observable details and separate them from interpretation.",
  recommendedSkills: ["playwright", "manual-frontend-qa"],
  recommendedTools: ["read", "look_at", "playwright"],
  guidance: "Return visual observations, screenshots, or media findings in the requested format.",
})

export const reviewerManifest = defineRoleManifest({
  id: "role:reviewer",
  name: "reviewer",
  displayName: "Reviewer",
  category: "subagent",
  description:
    "Reviews completed changes against requirements, quality, and risks. It prioritizes actionable findings over style-only commentary.",
  recommendedSkills: ["requesting-code-review", "receiving-code-review"],
  recommendedTools: ["read", "grep", "git diff", "lsp_diagnostics"],
  guidance:
    "Verify the stated goal, cite concrete issues, and distinguish blockers from suggestions.",
})

export const testerManifest = defineRoleManifest({
  id: "role:tester",
  name: "tester",
  displayName: "Tester",
  category: "subagent",
  description:
    "Designs and runs verification for a bounded change. It covers expected behavior, edge cases, and regression risks.",
  recommendedSkills: ["test-driven-development", "manual-frontend-qa"],
  recommendedTools: ["read", "bash", "apply_patch", "lsp_diagnostics"],
  guidance:
    "Create or run tests for the assigned behavior and delegate only visual inspection details when needed.",
})

export const documentationManifest = defineRoleManifest({
  id: "role:documentation",
  name: "documentation",
  displayName: "Documentation",
  category: "subagent",
  description:
    "Maintains concise documentation for completed changes. It updates user-facing or project-facing notes without expanding scope.",
  recommendedSkills: ["writing-adrs"],
  recommendedTools: ["read", "apply_patch"],
  guidance:
    "Document the agreed facts, avoid long prompts, and preserve existing documentation style.",
})

export const subagentRoleManifests = [
  researcherManifest,
  explorerManifest,
  programmerLowManifest,
  programmerMediumManifest,
  programmerHighManifest,
  multiModalAssistantManifest,
  reviewerManifest,
  testerManifest,
  documentationManifest,
] as const
