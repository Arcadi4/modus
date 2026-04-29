import { defineRoleManifest } from "../schema"

export const architectManifest = defineRoleManifest({
  id: "role:architect",
  name: "architect",
  neutralName: "Architect",
  category: "primary",
  description:
    "Shapes user goals into coherent designs and preserves project-level context. It emphasizes critical dialogue, reference gathering, and concise decisions.",
  recommendedCapabilities: {
    modalities: ["text", "code"],
    reasoningLevel: "deep",
    toolUseLevel: "full",
    contextWindow: "very-large",
  },
  defaultSkillExposure: { recommendedSkills: ["brainstorming", "writing-plans", "context7"] },
  defaultToolExposure: {
    recommendedTools: ["read", "grep", "glob", "webfetch", "context7"],
    notes: "Exposure is advisory metadata for design and research workflows.",
  },
  delegationGuidance: {
    canDelegate: true,
    delegatesTo: ["researcher", "explorer", "planner", "documentation"],
    acceptsDelegationFrom: [],
    guidance:
      "Delegate bounded research, codebase exploration, planning, and documentation tasks while retaining design ownership.",
  },
})

export const plannerManifest = defineRoleManifest({
  id: "role:planner",
  name: "planner",
  neutralName: "Planner",
  category: "primary",
  description:
    "Turns approved designs into ordered implementation plans. It favors minimal output, precise steps, and verifiable acceptance criteria.",
  recommendedCapabilities: {
    modalities: ["text", "code"],
    reasoningLevel: "deep",
    toolUseLevel: "limited",
    contextWindow: "large",
  },
  defaultSkillExposure: { recommendedSkills: ["writing-plans"] },
  defaultToolExposure: {
    recommendedTools: ["read", "grep", "glob"],
    notes: "Tools support plan grounding only and do not enforce execution policy.",
  },
  delegationGuidance: {
    canDelegate: true,
    delegatesTo: ["explorer", "researcher"],
    acceptsDelegationFrom: ["architect"],
    guidance:
      "Delegate discovery only when plan inputs are incomplete, then produce a single executable plan.",
  },
})

export const executorManifest = defineRoleManifest({
  id: "role:executor",
  name: "executor",
  neutralName: "Executor",
  category: "primary",
  description:
    "Coordinates execution of an existing plan and verifies completion. It prefers delegation and direct edits only for narrow or trivial work.",
  recommendedCapabilities: {
    modalities: ["text", "code"],
    reasoningLevel: "extended",
    toolUseLevel: "full",
    contextWindow: "very-large",
  },
  defaultSkillExposure: {
    recommendedSkills: [
      "executing-plans",
      "subagent-driven-development",
      "verification-before-completion",
    ],
  },
  defaultToolExposure: {
    recommendedTools: ["read", "bash", "apply_patch", "lsp_diagnostics", "todowrite"],
    notes: "Tool metadata describes execution needs without granting or denying tools.",
  },
  delegationGuidance: {
    canDelegate: true,
    delegatesTo: [
      "programmer-low",
      "programmer-medium",
      "programmer-high",
      "tester",
      "reviewer",
      "documentation",
    ],
    acceptsDelegationFrom: ["architect", "planner"],
    guidance: "Break plans into atomic tasks and verify each result before declaring completion.",
  },
})

export const agileHighManifest = defineRoleManifest({
  id: "role:agile-high",
  name: "agile-high",
  neutralName: "Agile High",
  category: "primary",
  description:
    "Handles unplanned high-complexity tasks that need adaptive reasoning and tool use. It combines planning and execution for one atomic outcome.",
  recommendedCapabilities: {
    modalities: ["text", "code"],
    reasoningLevel: "deep",
    toolUseLevel: "full",
    contextWindow: "large",
  },
  defaultSkillExposure: {
    recommendedSkills: [
      "systematic-debugging",
      "test-driven-development",
      "verification-before-completion",
    ],
  },
  defaultToolExposure: {
    recommendedTools: ["read", "grep", "bash", "apply_patch", "lsp_diagnostics"],
    notes: "Recommended for complex debugging, integration, and configuration work.",
  },
  delegationGuidance: {
    canDelegate: true,
    delegatesTo: ["explorer", "tester", "reviewer", "programmer-high"],
    acceptsDelegationFrom: ["architect", "executor"],
    guidance:
      "Delegate isolated discovery or review while keeping responsibility for the atomic result.",
  },
})

export const agileLowManifest = defineRoleManifest({
  id: "role:agile-low",
  name: "agile-low",
  neutralName: "Agile Low",
  category: "primary",
  description:
    "Handles unplanned low-risk tasks that still need careful verification. It is suited to small fixes, light configuration, and focused updates.",
  recommendedCapabilities: {
    modalities: ["text", "code"],
    reasoningLevel: "extended",
    toolUseLevel: "full",
    contextWindow: "standard",
  },
  defaultSkillExposure: {
    recommendedSkills: ["test-driven-development", "verification-before-completion"],
  },
  defaultToolExposure: {
    recommendedTools: ["read", "bash", "apply_patch", "lsp_diagnostics"],
    notes: "Use as metadata for routine but non-trivial atomic work.",
  },
  delegationGuidance: {
    canDelegate: false,
    delegatesTo: [],
    acceptsDelegationFrom: ["architect", "executor"],
    guidance: "Complete the assigned atomic task directly and escalate if scope expands.",
  },
})

export const introspectiveManifest = defineRoleManifest({
  id: "role:introspective",
  name: "introspective",
  neutralName: "Introspective",
  category: "primary",
  description:
    "Extracts reusable project knowledge from completed sessions. It rejects vague or non-reproducible lessons rather than preserving noise.",
  recommendedCapabilities: {
    modalities: ["text"],
    reasoningLevel: "extended",
    toolUseLevel: "limited",
    contextWindow: "large",
  },
  defaultSkillExposure: { recommendedSkills: ["writing-skills", "writing-adrs"] },
  defaultToolExposure: {
    recommendedTools: ["read", "grep", "apply_patch"],
    notes: "Exposure supports documentation extraction and does not imply enforcement behavior.",
  },
  delegationGuidance: {
    canDelegate: false,
    delegatesTo: [],
    acceptsDelegationFrom: ["architect", "executor"],
    guidance: "Review session evidence, capture durable patterns, and avoid speculative guidance.",
  },
})

export const primaryRoleManifests = [
  architectManifest,
  plannerManifest,
  executorManifest,
  agileHighManifest,
  agileLowManifest,
  introspectiveManifest,
] as const
