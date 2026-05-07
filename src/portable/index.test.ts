import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "bun:test"

import { InstallModulesManifestSchema, validatePortableInstallManifestSet } from "../core"
import { installComponents, installModules, installProfiles, portableRoleManifests } from "./index"

const repoRoot = process.cwd()

describe("portable manifests", () => {
  it("load the published portable manifest set with existing paths", () => {
    const manifests = validatePortableInstallManifestSet(
      {
        modules: installModules,
        components: installComponents,
        profiles: installProfiles,
      },
      {
        pathExists: (portablePath) => existsSync(join(repoRoot, portablePath)),
      }
    )

    expect(manifests.modules.modules.map((module) => module.id)).toContain("portable-roles")
    expect(portableRoleManifests.some((manifest) => manifest.name === "architect")).toBe(true)
  })

  it("rejects duplicate module ids", () => {
    const duplicate = {
      version: 1,
      modules: [minimalModule("portable-roles"), minimalModule("portable-roles")],
    }

    expect(() => InstallModulesManifestSchema.parse(duplicate)).toThrow("Duplicate modules id")
  })

  it("rejects unsupported targets", () => {
    const invalid = {
      version: 1,
      modules: [{ ...minimalModule("portable-roles"), targets: ["unknown-host"] }],
    }

    expect(() => InstallModulesManifestSchema.parse(invalid)).toThrow()
  })

  it("rejects unknown module dependencies and references", () => {
    expect(() =>
      validatePortableInstallManifestSet({
        modules: {
          version: 1,
          modules: [{ ...minimalModule("portable-roles"), dependencies: ["missing-module"] }],
        },
        components: installComponents,
        profiles: installProfiles,
      })
    ).toThrow("Unknown module dependency")

    expect(() =>
      validatePortableInstallManifestSet({
        modules: installModules,
        components: {
          version: 1,
          components: [
            {
              id: "baseline:broken",
              family: "baseline",
              description: "Broken component.",
              modules: ["missing-module"],
            },
          ],
        },
        profiles: installProfiles,
      })
    ).toThrow("references unknown module")
  })

  it("rejects missing paths when a path checker is provided", () => {
    expect(() =>
      validatePortableInstallManifestSet(
        {
          modules: {
            version: 1,
            modules: [minimalModule("portable-roles", ["portable/missing"])],
          },
          components: {
            version: 1,
            components: [
              {
                id: "baseline:portable",
                family: "baseline",
                description: "Portable baseline.",
                modules: ["portable-roles"],
              },
            ],
          },
          profiles: {
            version: 1,
            profiles: {
              portable: {
                description: "Portable profile.",
                modules: ["portable-roles"],
              },
            },
          },
        },
        { pathExists: () => false }
      )
    ).toThrow("references missing path")
  })
})

describe("portable/core import boundary", () => {
  it("keeps core and portable modules free of OpenCode plugin imports", () => {
    const files = ["src/core/index.ts", "src/core/portable-manifest.ts", "src/portable/index.ts"]

    for (const file of files) {
      expect(readFileSync(join(repoRoot, file), "utf8")).not.toContain("@opencode-ai/plugin")
    }
  })
})

function minimalModule(id: string, paths = ["portable/roles"]) {
  return {
    id,
    kind: "roles",
    description: "Portable role manifests.",
    paths,
    targets: ["opencode"],
    dependencies: [],
    defaultInstall: true,
    cost: "light",
    stability: "stable",
  }
}
