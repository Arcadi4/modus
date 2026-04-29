import { describe, expect, it } from "vitest"
import { roleDefinitions } from "../types/roles"
import { RoleManifestSchema, roleManifests, roleManifestList, type RoleManifest } from "../roles"

describe("role manifests", () => {
  it("provides a valid manifest for every role name", () => {
    const expectedRoleNames = Object.keys(roleDefinitions).sort()
    const manifestRoleNames = Object.keys(roleManifests).sort()

    expect(manifestRoleNames).toEqual(expectedRoleNames)

    for (const manifest of roleManifestList) {
      const parsed: RoleManifest = RoleManifestSchema.parse(manifest)
      expect(parsed.name).toBe(manifest.name)
      expect(parsed.description.split(/[.!?]/).filter(Boolean).length).toBeLessThanOrEqual(2)
    }
  })
})
