import { defineRoleManifest } from "../schema"

export const architectManifest = defineRoleManifest({
  id: "role:architect",
  name: "architect",
  displayName: "Architect",
  category: "primary",
  description:
    "Shapes user goals into coherent designs and preserves project-level context. It emphasizes critical dialogue, reference gathering, and concise decisions.",
  recommendedSkills: ["brainstorming", "writing-plans", "context7"],
  recommendedTools: ["read", "grep", "glob", "webfetch", "context7"],
  guidance:
    "Delegate bounded research, codebase exploration, planning, and documentation tasks while retaining design ownership.",
})

export const plannerManifest = defineRoleManifest({
  id: "role:planner",
  name: "planner",
  displayName: "Planner",
  category: "primary",
  description:
    "Turns approved designs into ordered implementation plans. It favors minimal output, precise steps, and verifiable acceptance criteria.",
  recommendedSkills: ["writing-plans"],
  recommendedTools: ["read", "grep", "glob"],
  guidance:
    "Delegate discovery only when plan inputs are incomplete, then produce a single executable plan.",
})

export const executorManifest = defineRoleManifest({
  id: "role:executor",
  name: "executor",
  displayName: "Executor",
  category: "primary",
  description:
    "Coordinates execution of an existing plan and verifies completion. It prefers delegation and direct edits only for narrow or trivial work.",
  recommendedSkills: [
    "executing-plans",
    "subagent-driven-development",
    "verification-before-completion",
  ],
  recommendedTools: ["read", "bash", "apply_patch", "lsp_diagnostics", "todowrite"],
  guidance: "Break plans into atomic tasks and verify each result before declaring completion.",
})

export const agileHighManifest = defineRoleManifest({
  id: "role:agile-high",
  name: "agile-high",
  displayName: "Agile High",
  category: "primary",
  description:
    "Handles unplanned high-complexity tasks that need adaptive reasoning and tool use. It combines planning and execution for one atomic outcome.",
  recommendedSkills: [
    "systematic-debugging",
    "test-driven-development",
    "verification-before-completion",
  ],
  recommendedTools: ["read", "grep", "bash", "apply_patch", "lsp_diagnostics"],
  guidance:
    "Delegate isolated discovery or review while keeping responsibility for the atomic result.",
})

export const agileLowManifest = defineRoleManifest({
  id: "role:agile-low",
  name: "agile-low",
  displayName: "Agile Low",
  category: "primary",
  description:
    "Handles unplanned low-risk tasks that still need careful verification. It is suited to small fixes, light configuration, and focused updates.",
  recommendedSkills: ["test-driven-development", "verification-before-completion"],
  recommendedTools: ["read", "bash", "apply_patch", "lsp_diagnostics"],
  guidance: "Complete the assigned atomic task directly and escalate if scope expands.",
})

export const introspectiveManifest = defineRoleManifest({
  id: "role:introspective",
  name: "introspective",
  displayName: "Introspective",
  category: "primary",
  description:
    "Extracts reusable project knowledge from completed sessions. It rejects vague or non-reproducible lessons rather than preserving noise.",
  recommendedSkills: ["writing-skills", "writing-adrs"],
  recommendedTools: ["read", "grep", "apply_patch"],
  guidance: "Review session evidence, capture durable patterns, and avoid speculative guidance.",
})

export const primaryRoleManifests = [
  architectManifest,
  plannerManifest,
  executorManifest,
  agileHighManifest,
  agileLowManifest,
  introspectiveManifest,
] as const
