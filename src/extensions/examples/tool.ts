import type { ToolDescriptor } from "../schema"

export const exampleToolDescriptor: ToolDescriptor = {
  id: "arcadia.tool.harness-context",
  kind: "tool",
  surface: "tool",
  title: "Harness Context Tool",
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
    name: "harness_context",
    inputSchema: {},
  },
}
