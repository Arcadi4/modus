export type RoleCategory = "primary" | "subagent"

export type PrimaryRoleName =
  | "architect"
  | "planner"
  | "executor"
  | "agile-high"
  | "agile-low"
  | "introspective"

export type SubagentRoleName =
  | "researcher"
  | "explorer"
  | "programmer-low"
  | "programmer-medium"
  | "programmer-high"
  | "multi-modal-assistant"
  | "reviewer"
  | "tester"
  | "documentation"

export type RoleName = PrimaryRoleName | SubagentRoleName

export interface RoleDefinition {
  name: RoleName
  category: RoleCategory
  description: string
}

export const roleDefinitions: Record<RoleName, RoleDefinition> = {
  architect: {
    name: "architect",
    category: "primary",
    description: "Interactive, critical thinking, strategical search",
  },
  planner: {
    name: "planner",
    category: "primary",
    description: "Minimal output, deep reasoning, command following",
  },
  executor: {
    name: "executor",
    category: "primary",
    description: "Minimal output, long context retrieval, orchestrates sub-agents",
  },
  "agile-high": {
    name: "agile-high",
    category: "primary",
    description: "Deep reasoning, proficient terminal use, one-shot atomic tasks",
  },
  "agile-low": {
    name: "agile-low",
    category: "primary",
    description: "Deep reasoning, proficient terminal use, one-shot atomic tasks",
  },
  introspective: {
    name: "introspective",
    category: "primary",
    description: "Extracts skills/docs from sessions",
  },
  researcher: { name: "researcher", category: "subagent", description: "Online research" },
  explorer: { name: "explorer", category: "subagent", description: "Codebase exploration" },
  "programmer-low": {
    name: "programmer-low",
    category: "subagent",
    description: "Code writing/modifying",
  },
  "programmer-medium": {
    name: "programmer-medium",
    category: "subagent",
    description: "Code writing/modifying",
  },
  "programmer-high": {
    name: "programmer-high",
    category: "subagent",
    description: "Code writing/modifying",
  },
  "multi-modal-assistant": {
    name: "multi-modal-assistant",
    category: "subagent",
    description: "Visual models",
  },
  reviewer: { name: "reviewer", category: "subagent", description: "Code review feedback" },
  tester: { name: "tester", category: "subagent", description: "Test writing/execution" },
  documentation: { name: "documentation", category: "subagent", description: "Doc management" },
}

export function getRoleCategory(role: RoleName): RoleCategory {
  return roleDefinitions[role].category
}

export function isPrimaryRole(role: RoleName): boolean {
  return roleDefinitions[role].category === "primary"
}

export function isSubagentRole(role: RoleName): boolean {
  return roleDefinitions[role].category === "subagent"
}
