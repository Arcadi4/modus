import type { HookDescriptor } from "../schema"

export const exampleHookDescriptor: HookDescriptor = {
  id: "modus.hook.shell-env",
  kind: "hook",
  surface: "shell.env",
  title: "Shell Environment Hook",
  description: "Describes the existing shell environment hook surface.",
  capabilities: [
    {
      id: "server.hook.shell-env",
      reason: "Uses the host shell.env hook to add process environment metadata.",
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
  hook: {
    name: "shell.env",
    mutatesInput: false,
    mutatesOutput: true,
  },
}
