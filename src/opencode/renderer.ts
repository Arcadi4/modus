import type { RoleManifest } from "../roles"

export interface Renderer {
  render(manifest: RoleManifest): string
}

export function renderAgentDefinition(_manifest: RoleManifest): string {
  return ""
}