import type { ToolDescriptor } from "../schema"

export const exampleToolDescriptor: ToolDescriptor = {
  id: "modus.tool.modus-context",
  kind: "tool",
  surface: "tool",
  title: "Modus Context Tool",
  description: "Describes the existing context tool without implementing execution behavior.",
  capabilities: [
    {
      id: "server.tool.register",
      reason: "Uses the host custom tool registration surface.",
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
    name: "modus_context",
    inputSchema: {},
  },
}
