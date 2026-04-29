import { access, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { describe, expect, it } from "vitest"

import {
  buildLauncherState,
  ensureIsolatedProfile,
  normalizePluginConfig,
  parseLauncherArgs,
  syncAgentDefinitions,
} from "./dev-opencode-lib"
import type { SyncOptions, SyncResult } from "../src/opencode/types"

type ExplicitAgentSyncPlan = {
  agentsDir: string
  options: SyncOptions
  scope: "project" | "global" | "user"
}

type ExplicitAgentSyncInput = {
  agentsDir: string
  force?: boolean
  scope: "project" | "global" | "user"
}

type DevLibWithExplicitSync = typeof import("./dev-opencode-lib") & {
  buildExplicitAgentSyncPlan: (input: ExplicitAgentSyncInput) => ExplicitAgentSyncPlan
  syncExplicitAgentDefinitions: (plan: ExplicitAgentSyncPlan) => Promise<SyncResult>
}

describe("parseLauncherArgs", () => {
  it("uses isolated local directory install by default", () => {
    expect(parseLauncherArgs([])).toEqual({
      installTarball: false,
      noLaunch: false,
      profileDir: null,
      runMessage: "",
      useGlobal: false,
    })
  })

  it("parses explicit launcher options", () => {
    expect(
      parseLauncherArgs([
        "--global",
        "--profile-dir",
        "/tmp/harness-opencode",
        "--install-tarball",
        "--run",
        "verification ping",
        "--no-launch",
      ])
    ).toEqual({
      installTarball: true,
      noLaunch: true,
      profileDir: "/tmp/harness-opencode",
      runMessage: "verification ping",
      useGlobal: true,
    })
  })

  it("rejects missing option values", () => {
    expect(() => parseLauncherArgs(["--profile-dir"])).toThrow("Missing value for --profile-dir")
    expect(() => parseLauncherArgs(["--run"])).toThrow("Missing value for --run")
  })

  it("rejects unknown options", () => {
    expect(() => parseLauncherArgs(["--unexpected"])).toThrow("Unknown option: --unexpected")
  })
})

describe("normalizePluginConfig", () => {
  it("removes stale root and tarball refs while preserving other plugins", () => {
    const source = JSON.stringify({
      plugin: ["/repo/harness", "file:/repo/harness/harness-runtime-0.0.0.tgz", "other-plugin"],
      theme: "dark",
    })

    expect(
      normalizePluginConfig(source, {
        rootDir: "/repo/harness",
        tarballRef: "file:/repo/harness/harness-runtime-0.0.0.tgz",
      })
    ).toEqual({
      changed: true,
      json: '{\n  "plugin": [\n    "other-plugin"\n  ],\n  "theme": "dark"\n}\n',
    })
  })

  it("normalizes missing plugin arrays to an empty plugin list", () => {
    expect(
      normalizePluginConfig(JSON.stringify({ theme: "dark" }), {
        rootDir: "/repo/harness",
        tarballRef: "file:/repo/harness/harness-runtime-0.0.0.tgz",
      })
    ).toEqual({
      changed: false,
      json: '{\n  "theme": "dark",\n  "plugin": []\n}\n',
    })
  })
})

describe("buildLauncherState", () => {
  it("builds isolated profile paths for harness-runtime", () => {
    const state = buildLauncherState({
      installTarball: false,
      packageName: "harness-runtime",
      packageVersion: "0.0.0",
      profileDir: null,
      rootDir: "/repo/harness",
      useGlobal: false,
    })

    expect(state).toMatchObject({
      cacheDir: "/repo/harness/.opencode-dev/cache/opencode",
      configDir: "/repo/harness/.opencode-dev/config/opencode",
      dataDir: "/repo/harness/.opencode-dev/data/opencode",
      pluginRef: "/repo/harness",
      profileDir: "/repo/harness/.opencode-dev",
      rootDir: "/repo/harness",
      tarballName: "harness-runtime-0.0.0.tgz",
      tarballPath: "/repo/harness/harness-runtime-0.0.0.tgz",
      tarballRef: "file:/repo/harness/harness-runtime-0.0.0.tgz",
      useGlobal: false,
    })
    expect(state.env.OPENCODE_CONFIG_DIR).toBe("/repo/harness/.opencode-dev/config/opencode")
    expect(state.env.XDG_CONFIG_HOME).toBe("/repo/harness/.opencode-dev/config")
    expect(state.env.XDG_DATA_HOME).toBe("/repo/harness/.opencode-dev/data")
    expect(state.env.XDG_CACHE_HOME).toBe("/repo/harness/.opencode-dev/cache")
  })

  it("switches to tarball plugin ref when requested", () => {
    const state = buildLauncherState({
      installTarball: true,
      packageName: "harness-runtime",
      packageVersion: "0.0.0",
      profileDir: "/tmp/harness-profile",
      rootDir: "/repo/harness",
      useGlobal: false,
    })

    expect(state.pluginRef).toBe("file:/repo/harness/harness-runtime-0.0.0.tgz")
    expect(state.profileDir).toBe("/tmp/harness-profile")
  })
})

describe("ensureIsolatedProfile", () => {
  it("creates an isolated profile without copying user config or auth files", async () => {
    const root = path.join(tmpdir(), `harness-opencode-${Date.now()}`)
    const home = path.join(root, "home")
    const profileDir = path.join(root, "profile")
    await mkdir(path.join(home, ".config", "opencode"), { recursive: true })
    await mkdir(path.join(home, ".local", "share", "opencode"), { recursive: true })
    await writeFile(path.join(home, ".config", "opencode", "opencode.json"), '{"token":"secret"}')
    await writeFile(
      path.join(home, ".local", "share", "opencode", "auth.json"),
      '{"token":"secret"}'
    )

    const previousHome = process.env.HOME
    process.env.HOME = home

    try {
      const state = buildLauncherState({
        installTarball: false,
        packageName: "harness-runtime",
        packageVersion: "0.0.0",
        profileDir,
        rootDir: path.join(root, "repo"),
        useGlobal: false,
      })

      await ensureIsolatedProfile(state)

      await expect(fileExists(state.configDir)).resolves.toBe(true)
      await expect(fileExists(state.dataDir)).resolves.toBe(true)
      await expect(fileExists(state.cacheDir)).resolves.toBe(true)
      await expect(fileExists(path.join(state.configDir, "opencode.json"))).resolves.toBe(false)
      await expect(fileExists(path.join(state.dataDir, "auth.json"))).resolves.toBe(false)
    } finally {
      if (previousHome === undefined) {
        delete process.env.HOME
      } else {
        process.env.HOME = previousHome
      }
      await rm(root, { force: true, recursive: true })
    }
  })
})

describe("syncAgentDefinitions", () => {
  it("materializes dev agents only into the isolated .opencode-dev profile", async () => {
    const root = path.join(tmpdir(), `harness-opencode-dev-sync-${Date.now()}`)
    const home = path.join(root, "home")

    await mkdir(path.join(home, ".config", "opencode", "agents"), { recursive: true })
    await mkdir(path.join(root, ".opencode", "agents"), { recursive: true })

    const previousHome = process.env.HOME
    process.env.HOME = home

    try {
      const state = buildLauncherState({
        installTarball: false,
        packageName: "harness-runtime",
        packageVersion: "0.0.0",
        profileDir: null,
        rootDir: root,
        useGlobal: false,
      })

      await syncAgentDefinitions(state)

      const agentsDir = path.join(root, ".opencode-dev", "config", "opencode", "agents")
      const generatedAgents = await readdir(agentsDir)

      expect(agentsDir).toBe(path.join(state.configDir, "agents"))
      expect(generatedAgents.length).toBeGreaterThan(0)
      await expect(readdir(path.join(home, ".config", "opencode", "agents"))).resolves.toEqual([])
      await expect(readdir(path.join(root, ".opencode", "agents"))).resolves.toEqual([])
    } finally {
      if (previousHome === undefined) {
        delete process.env.HOME
      } else {
        process.env.HOME = previousHome
      }
      await rm(root, { force: true, recursive: true })
    }
  })
})

describe("explicit agent sync safety", () => {
  it("builds explicit target sync plans as dry-run and no-overwrite by default", async () => {
    const { buildExplicitAgentSyncPlan } = await loadExplicitSyncApi()
    const agentsDir = path.join(tmpdir(), `harness-explicit-sync-${Date.now()}`, "agents")

    const plan = buildExplicitAgentSyncPlan({ agentsDir, scope: "project" })

    expect(plan).toMatchObject({
      agentsDir,
      scope: "project",
      options: {
        backup: true,
        dryRun: true,
        overwritePolicy: "error",
      },
    })
  })

  it("refuses unmanaged collisions in explicit targets without interactive prompts", async () => {
    const { buildExplicitAgentSyncPlan, syncExplicitAgentDefinitions } = await loadExplicitSyncApi()
    const root = path.join(tmpdir(), `harness-explicit-refuse-${Date.now()}`)
    const agentsDir = path.join(root, "agents")
    await mkdir(agentsDir, { recursive: true })
    await writeFile(path.join(agentsDir, "architect.md"), "user-owned content\n")

    try {
      const plan = buildExplicitAgentSyncPlan({ agentsDir, scope: "project" })
      const result = await syncExplicitAgentDefinitions({
        ...plan,
        options: { ...plan.options, dryRun: false },
      })

      expect(result.success).toBe(false)
      expect(result.refused).toBeGreaterThan(0)
      expect(result.files).toContainEqual(
        expect.objectContaining({
          operation: "refused",
          path: path.join(agentsDir, "architect.md"),
        })
      )
      await expect(readFile(path.join(agentsDir, "architect.md"), "utf8")).resolves.toBe(
        "user-owned content\n"
      )
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  it("backs up unmanaged files before explicit force overwrites", async () => {
    const { buildExplicitAgentSyncPlan, syncExplicitAgentDefinitions } = await loadExplicitSyncApi()
    const root = path.join(tmpdir(), `harness-explicit-force-${Date.now()}`)
    const agentsDir = path.join(root, "agents")
    const targetFile = path.join(agentsDir, "architect.md")
    await mkdir(agentsDir, { recursive: true })
    await writeFile(targetFile, "user-owned content\n")

    try {
      const plan = buildExplicitAgentSyncPlan({ agentsDir, force: true, scope: "project" })
      const result = await syncExplicitAgentDefinitions(plan)

      expect(plan.options).toMatchObject({ backup: true, dryRun: false, overwritePolicy: "backup" })
      expect(result.success).toBe(true)
      expect(result.backups.length).toBeGreaterThan(0)
      expect(result.files).toContainEqual(
        expect.objectContaining({
          backupPath: expect.any(String),
          operation: "updated",
          path: targetFile,
        })
      )

      const backupPath = result.files.find((file) => file.path === targetFile)?.backupPath
      expect(backupPath).toBeDefined()
      await expect(readFile(backupPath as string, "utf8")).resolves.toBe("user-owned content\n")
      await expect(readFile(targetFile, "utf8")).resolves.not.toBe("user-owned content\n")
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })
})

async function loadExplicitSyncApi(): Promise<DevLibWithExplicitSync> {
  const module = (await import("./dev-opencode-lib")) as Partial<DevLibWithExplicitSync>

  expect(typeof module.buildExplicitAgentSyncPlan).toBe("function")
  expect(typeof module.syncExplicitAgentDefinitions).toBe("function")

  return module as DevLibWithExplicitSync
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}
