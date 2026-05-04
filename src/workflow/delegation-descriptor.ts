import type { ToolDescriptor } from "../extensions/schema"

export const delegateTaskToolDescriptor: ToolDescriptor = {
  id: "modus.tool.delegate-task",
  kind: "tool",
  surface: "tool",
  title: "Delegate Task",
  description: "Delegate a task to a subagent with plan-aware context including task ID, expected outcome, constraints, and evidence path.",
  capabilities: [
    {
      id: "server.tool.register",
      reason: "Registers custom tool for task delegation.",
      optional: false,
    },
    {
      id: "server.session.create",
      reason: "Creates child sessions for delegated tasks.",
      optional: false,
    },
  ],
  safety: {
    riskLevel: "low",
    touchesFilesystem: false,
    usesNetwork: false,
    requiresConfirmation: false,
  },
  experimental: false,
  manifest: {},
  tool: {
    name: "delegate_task",
    inputSchema: {},
  },
}
