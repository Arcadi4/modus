import type { CommandDescriptor } from "../schema"

export const exampleCommandDescriptor: CommandDescriptor = {
  id: "arcadia.command.show-context",
  kind: "command",
  surface: "tui.command",
  title: "Show Harness Context",
  description: "Expose a minimal command descriptor for future TUI registration.",
  capabilities: [
    {
      id: "tui.command.register",
      reason: "Uses the host TUI command registration surface.",
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
  command: {
    name: "arcadia.show-context",
    usage: "Open the harness context command from a host command surface.",
  },
}
