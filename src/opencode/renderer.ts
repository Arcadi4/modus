import type { RoleManifest } from "../roles"
import type { OpenCodeAgentDescriptor } from "./opencode-adapter"

export interface Renderer {
  render(manifest: RoleManifest): string
}

export function renderAgentDefinition(descriptor: OpenCodeAgentDescriptor): string {
  const { recommendations } = descriptor
  const lines = [
    "---",
    `description: ${JSON.stringify(descriptor.description)}`,
    `mode: ${descriptor.category}`,
    "---",
    descriptor.source.managedMarker,
    `Source role: ${descriptor.roleId}`,
    `Source hash: ${descriptor.source.hash}`,
    "",
    `# ${descriptor.id}`,
    "",
    `${descriptor.description}`,
    "",
    "This profile provides recommendations only for the current task.",
  ]

  if (recommendations.skills?.length) {
    lines.push("", `Suggested skills: ${recommendations.skills.join(", ")}.`)
  }

  if (recommendations.tools?.length) {
    lines.push("", `Suggested tools: ${recommendations.tools.join(", ")}.`)
  }

  if (recommendations.guidance) {
    lines.push("", "Guidance:", recommendations.guidance)
  }

  return `${lines.join("\n")}\n`
}
