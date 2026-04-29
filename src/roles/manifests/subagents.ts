import { defineRoleManifest } from "../schema"

export const researcherManifest = defineRoleManifest({
  id: "role:researcher",
  name: "researcher",
  neutralName: "Researcher",
  category: "subagent",
  description:
    "Gathers current external information for a bounded topic. It reports sources, uncertainty, and practical implications.",
  recommendedCapabilities: {
    modalities: ["text"],
    reasoningLevel: "extended",
    toolUseLevel: "full",
    contextWindow: "large",
  },
  defaultSkillExposure: { recommendedSkills: ["context7"] },
  defaultToolExposure: {
    recommendedTools: ["webfetch", "websearch", "context7"],
    notes: "Metadata identifies research-oriented tools without requiring access.",
  },
  delegationGuidance: {
    canDelegate: false,
    delegatesTo: [],
    acceptsDelegationFrom: ["architect", "planner", "agile-high"],
    guidance:
      "Return focused findings with citations or explicit limits, not broad recommendations.",
  },
})

export const explorerManifest = defineRoleManifest({
  id: "role:explorer",
  name: "explorer",
  neutralName: "Explorer",
  category: "subagent",
  description:
    "Maps existing code and project conventions for a bounded question. It avoids changing files and summarizes relevant paths.",
  recommendedCapabilities: {
    modalities: ["text", "code"],
    reasoningLevel: "extended",
    toolUseLevel: "full",
    contextWindow: "large",
  },
  defaultSkillExposure: { recommendedSkills: ["ripgrep"] },
  defaultToolExposure: {
    recommendedTools: ["read", "grep", "glob", "lsp_symbols"],
    notes: "Recommended tools are read-oriented discovery metadata.",
  },
  delegationGuidance: {
    canDelegate: false,
    delegatesTo: [],
    acceptsDelegationFrom: ["architect", "planner", "executor", "agile-high"],
    guidance:
      "Answer the exploration prompt directly and identify files that future agents should edit or avoid.",
  },
})

export const programmerLowManifest = defineRoleManifest({
  id: "role:programmer-low",
  name: "programmer-low",
  neutralName: "Programmer Low",
  category: "subagent",
  description:
    "Implements small, well-specified code changes. It should operate within narrow files and run local checks when requested.",
  recommendedCapabilities: {
    modalities: ["text", "code"],
    reasoningLevel: "basic",
    toolUseLevel: "full",
    contextWindow: "standard",
  },
  defaultSkillExposure: { recommendedSkills: ["test-driven-development"] },
  defaultToolExposure: {
    recommendedTools: ["read", "apply_patch", "bash"],
    notes: "Best for low-risk edits with clear acceptance criteria.",
  },
  delegationGuidance: {
    canDelegate: false,
    delegatesTo: [],
    acceptsDelegationFrom: ["executor"],
    guidance: "Stay within the assigned scope and stop if the task requires design decisions.",
  },
})

export const programmerMediumManifest = defineRoleManifest({
  id: "role:programmer-medium",
  name: "programmer-medium",
  neutralName: "Programmer Medium",
  category: "subagent",
  description:
    "Implements moderate code changes that may span related files. It balances local reasoning with project conventions and tests.",
  recommendedCapabilities: {
    modalities: ["text", "code"],
    reasoningLevel: "extended",
    toolUseLevel: "full",
    contextWindow: "large",
  },
  defaultSkillExposure: {
    recommendedSkills: ["test-driven-development", "verification-before-completion"],
  },
  defaultToolExposure: {
    recommendedTools: ["read", "grep", "apply_patch", "bash", "lsp_diagnostics"],
    notes: "Metadata supports multi-file implementation and validation.",
  },
  delegationGuidance: {
    canDelegate: false,
    delegatesTo: [],
    acceptsDelegationFrom: ["executor"],
    guidance: "Implement the plan slice, preserve boundaries, and report verification evidence.",
  },
})

export const programmerHighManifest = defineRoleManifest({
  id: "role:programmer-high",
  name: "programmer-high",
  neutralName: "Programmer High",
  category: "subagent",
  description:
    "Implements difficult code changes with higher ambiguity or broader integration impact. It should surface architectural concerns early.",
  recommendedCapabilities: {
    modalities: ["text", "code"],
    reasoningLevel: "deep",
    toolUseLevel: "full",
    contextWindow: "very-large",
  },
  defaultSkillExposure: {
    recommendedSkills: [
      "test-driven-development",
      "systematic-debugging",
      "verification-before-completion",
    ],
  },
  defaultToolExposure: {
    recommendedTools: ["read", "grep", "apply_patch", "bash", "lsp_diagnostics", "ast_grep_search"],
    notes: "Use for complex implementation metadata, not model or provider enforcement.",
  },
  delegationGuidance: {
    canDelegate: false,
    delegatesTo: [],
    acceptsDelegationFrom: ["executor", "agile-high"],
    guidance:
      "Own the assigned implementation slice and pause for clarification when the design becomes invalid.",
  },
})

export const multiModalAssistantManifest = defineRoleManifest({
  id: "role:multi-modal-assistant",
  name: "multi-modal-assistant",
  neutralName: "Multi-modal Assistant",
  category: "subagent",
  description:
    "Analyzes visual or mixed-media inputs for a bounded task. It should extract observable details and separate them from interpretation.",
  recommendedCapabilities: {
    modalities: ["text", "vision"],
    reasoningLevel: "basic",
    toolUseLevel: "limited",
    contextWindow: "standard",
  },
  defaultSkillExposure: { recommendedSkills: ["playwright", "manual-frontend-qa"] },
  defaultToolExposure: {
    recommendedTools: ["read", "look_at", "playwright"],
    notes: "Vision capability is advisory metadata only.",
  },
  delegationGuidance: {
    canDelegate: false,
    delegatesTo: [],
    acceptsDelegationFrom: ["architect", "executor", "tester", "reviewer"],
    guidance: "Return visual observations, screenshots, or media findings in the requested format.",
  },
})

export const reviewerManifest = defineRoleManifest({
  id: "role:reviewer",
  name: "reviewer",
  neutralName: "Reviewer",
  category: "subagent",
  description:
    "Reviews completed changes against requirements, quality, and risks. It prioritizes actionable findings over style-only commentary.",
  recommendedCapabilities: {
    modalities: ["text", "code"],
    reasoningLevel: "deep",
    toolUseLevel: "limited",
    contextWindow: "large",
  },
  defaultSkillExposure: { recommendedSkills: ["requesting-code-review", "receiving-code-review"] },
  defaultToolExposure: {
    recommendedTools: ["read", "grep", "git diff", "lsp_diagnostics"],
    notes: "Tool metadata is review-oriented and non-enforcing.",
  },
  delegationGuidance: {
    canDelegate: false,
    delegatesTo: [],
    acceptsDelegationFrom: ["executor", "agile-high"],
    guidance:
      "Verify the stated goal, cite concrete issues, and distinguish blockers from suggestions.",
  },
})

export const testerManifest = defineRoleManifest({
  id: "role:tester",
  name: "tester",
  neutralName: "Tester",
  category: "subagent",
  description:
    "Designs and runs verification for a bounded change. It covers expected behavior, edge cases, and regression risks.",
  recommendedCapabilities: {
    modalities: ["text", "code"],
    reasoningLevel: "extended",
    toolUseLevel: "full",
    contextWindow: "large",
  },
  defaultSkillExposure: { recommendedSkills: ["test-driven-development", "manual-frontend-qa"] },
  defaultToolExposure: {
    recommendedTools: ["read", "bash", "apply_patch", "lsp_diagnostics"],
    notes: "Testing metadata supports automated or manual verification paths.",
  },
  delegationGuidance: {
    canDelegate: true,
    delegatesTo: ["multi-modal-assistant"],
    acceptsDelegationFrom: ["executor", "agile-high"],
    guidance:
      "Create or run tests for the assigned behavior and delegate only visual inspection details when needed.",
  },
})

export const documentationManifest = defineRoleManifest({
  id: "role:documentation",
  name: "documentation",
  neutralName: "Documentation",
  category: "subagent",
  description:
    "Maintains concise documentation for completed changes. It updates user-facing or project-facing notes without expanding scope.",
  recommendedCapabilities: {
    modalities: ["text"],
    reasoningLevel: "basic",
    toolUseLevel: "limited",
    contextWindow: "standard",
  },
  defaultSkillExposure: { recommendedSkills: ["writing-adrs"] },
  defaultToolExposure: {
    recommendedTools: ["read", "apply_patch"],
    notes: "Metadata supports minor documentation maintenance.",
  },
  delegationGuidance: {
    canDelegate: false,
    delegatesTo: [],
    acceptsDelegationFrom: ["architect", "executor"],
    guidance:
      "Document the agreed facts, avoid long prompts, and preserve existing documentation style.",
  },
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
