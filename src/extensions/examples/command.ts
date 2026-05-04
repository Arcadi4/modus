import type { CommandDescriptor } from "../schema"

export const exampleCommandDescriptor: CommandDescriptor = {
  id: "modus.command.show-context",
  kind: "command",
  surface: "tui.command",
  title: "Show Modus Context",
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
    name: "modus.show-context",
    usage: "Open the modus context command from a host command surface.",
  },
}
