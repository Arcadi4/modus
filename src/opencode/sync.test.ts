import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it } from "bun:test"

import { syncFiles } from "./sync"
import type { OpenCodeAgentDescriptor } from "./opencode-adapter"
import type { SyncOptions, SyncResult, TargetConfig } from "./types"

const MANAGED_MARKER = "<!-- MANAGED BY HARNESS -->"

type SyncContractOptions = SyncOptions & {
  descriptors: OpenCodeAgentDescriptor[]
  writeFile?: (filePath: string, contents: string) => Promise<void>
}

const roots: string[] = []

describe("syncFiles managed lifecycle", () => {
  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })))
  })

  it("creates managed agent files from descriptors in a fresh target", async () => {
    const { target, targetDir } = await makeTarget()
    const descriptors = [descriptor("harness-alpha", "alpha-hash")]

    const result = await syncWithDescriptors(target, descriptors)

    expect(result.success).toBe(true)
    expect(result.created).toBe(1)
    expect(result.updated).toBe(0)
    expect(result.skipped).toBe(0)
    expect(result.files).toContainEqual(
      expect.objectContaining({ path: agentPath(targetDir, "harness-alpha"), operation: "created" })
    )
    const contents = await readUtf8(agentPath(targetDir, "harness-alpha"))
    expect(contents).toContain(MANAGED_MARKER)
    expect(contents).toContain("harness-alpha")
    expect(contents).toContain("alpha-hash")
  })

  it("skips unchanged managed files on rerun without rewriting them", async () => {
    const { target, targetDir } = await makeTarget()
    const descriptors = [descriptor("harness-alpha", "alpha-hash")]

    await syncWithDescriptors(target, descriptors)
    const filePath = agentPath(targetDir, "harness-alpha")
    const beforeContents = await readUtf8(filePath)
    const beforeStat = await stat(filePath)
    await sleepPastMtimeResolution()

    const result = await syncWithDescriptors(target, descriptors)

    expect(result.success).toBe(true)
    expect(result.created).toBe(0)
    expect(result.updated).toBe(0)
    expect(result.skipped).toBe(1)
    expect(result.files).toContainEqual(
      expect.objectContaining({ path: filePath, operation: "skipped", reason: expect.any(String) })
    )
    const afterStat = await stat(filePath)
    expect(await readUtf8(filePath)).toBe(beforeContents)
    expect(afterStat.mtimeMs).toBe(beforeStat.mtimeMs)
  })

  it("updates a managed file when descriptor content or hash changes", async () => {
    const { target, targetDir } = await makeTarget()
    await syncWithDescriptors(target, [descriptor("harness-alpha", "alpha-v1", "first description")])

    const result = await syncWithDescriptors(target, [descriptor("harness-alpha", "alpha-v2", "second description")])

    expect(result.success).toBe(true)
    expect(result.created).toBe(0)
    expect(result.updated).toBe(1)
    const contents = await readUtf8(agentPath(targetDir, "harness-alpha"))
    expect(contents).toContain("alpha-v2")
    expect(contents).toContain("second description")
    expect(contents).not.toContain("alpha-v1")
  })

  it("deletes stale generated files when their descriptor disappears", async () => {
    const { target, targetDir } = await makeTarget()
    await syncWithDescriptors(target, [
      descriptor("harness-alpha", "alpha-hash"),
      descriptor("harness-beta", "beta-hash"),
    ])

    const result = await syncWithDescriptors(target, [descriptor("harness-alpha", "alpha-hash")])

    expect(result.success).toBe(true)
    expect(result.deleted).toBe(1)
    expect(result.files).toContainEqual(
      expect.objectContaining({ path: agentPath(targetDir, "harness-beta"), operation: "deleted" })
    )
    await expect(fileExists(agentPath(targetDir, "harness-alpha"))).resolves.toBe(true)
    await expect(fileExists(agentPath(targetDir, "harness-beta"))).resolves.toBe(false)
  })

  it("refuses to overwrite unmanaged files at target paths by default", async () => {
    const { target, targetDir } = await makeTarget()
    const filePath = agentPath(targetDir, "harness-alpha")
    await mkdir(targetDir, { recursive: true })
    await writeFile(filePath, "user-owned agent\n")

    const result = await syncWithDescriptors(target, [descriptor("harness-alpha", "alpha-hash")])

    expect(result.success).toBe(false)
    expect(result.refused).toBe(1)
    expect(result.created).toBe(0)
    expect(result.files).toContainEqual(
      expect.objectContaining({ path: filePath, operation: "refused", reason: expect.stringMatching(/unmanaged|collision/i) })
    )
    expect(await readUtf8(filePath)).toBe("user-owned agent\n")
  })

  it("reports dry-run operations without mutating the filesystem", async () => {
    const { target, targetDir } = await makeTarget()
    const descriptors = [descriptor("harness-alpha", "alpha-hash")]

    const result = await syncWithDescriptors(target, descriptors, { dryRun: true })

    expect(result.success).toBe(true)
    expect(result.created).toBe(1)
    expect(result.files).toContainEqual(
      expect.objectContaining({ path: agentPath(targetDir, "harness-alpha"), operation: "created" })
    )
    await expect(fileExists(agentPath(targetDir, "harness-alpha"))).resolves.toBe(false)
  })

  it("creates a backup before replacing an existing managed file", async () => {
    const { target, targetDir } = await makeTarget()
    const filePath = agentPath(targetDir, "harness-alpha")
    await syncWithDescriptors(target, [descriptor("harness-alpha", "alpha-v1", "first description")])
    const originalContents = await readUtf8(filePath)

    const result = await syncWithDescriptors(target, [descriptor("harness-alpha", "alpha-v2", "second description")], {
      backup: true,
      overwritePolicy: "backup",
    })

    expect(result.success).toBe(true)
    expect(result.updated).toBe(1)
    expect(result.backups).toHaveLength(1)
    expect(result.files).toContainEqual(
      expect.objectContaining({ path: filePath, operation: "updated", backupPath: result.backups[0] })
    )
    expect(await readUtf8(result.backups[0])).toBe(originalContents)
    expect(await readUtf8(filePath)).toContain("alpha-v2")
  })

  it("refuses managed updates when no-overwrite policy is requested", async () => {
    const { target, targetDir } = await makeTarget()
    const filePath = agentPath(targetDir, "harness-alpha")
    await syncWithDescriptors(target, [descriptor("harness-alpha", "alpha-v1")])
    const originalContents = await readUtf8(filePath)

    const result = await syncWithDescriptors(target, [descriptor("harness-alpha", "alpha-v2")], {
      backup: false,
      overwritePolicy: "error",
    })

    expect(result.success).toBe(false)
    expect(result.refused).toBe(1)
    expect(result.updated).toBe(0)
    expect(result.backups).toEqual([])
    expect(await readUtf8(filePath)).toBe(originalContents)
  })

  it("refuses corrupted managed files with malformed metadata instead of overwriting them", async () => {
    const { target, targetDir } = await makeTarget()
    const filePath = agentPath(targetDir, "harness-alpha")
    await mkdir(targetDir, { recursive: true })
    await writeFile(filePath, `${MANAGED_MARKER}\n<!-- harness:meta {not-json} -->\ncorrupted managed content\n`)

    const result = await syncWithDescriptors(target, [descriptor("harness-alpha", "alpha-hash")])

    expect(result.success).toBe(false)
    expect(result.refused).toBe(1)
    expect(result.files).toContainEqual(
      expect.objectContaining({ path: filePath, operation: "refused", reason: expect.stringMatching(/malformed|corrupt/i) })
    )
    expect(await readUtf8(filePath)).toContain("corrupted managed content")
  })

  it("keeps the previous managed file intact if an atomic replacement write fails", async () => {
    const { target, targetDir } = await makeTarget()
    const filePath = agentPath(targetDir, "harness-alpha")
    await syncWithDescriptors(target, [descriptor("harness-alpha", "alpha-v1", "stable description")])
    const originalContents = await readUtf8(filePath)

    const result = await syncWithDescriptors(target, [descriptor("harness-alpha", "alpha-v2", "new description")], {
      writeFile: async (candidatePath, contents) => {
        await writeFile(candidatePath, `${contents.slice(0, 12)}\nPARTIAL WRITE\n`)
        throw new Error("simulated write failure")
      },
    })

    expect(result.success).toBe(false)
    expect(result.errors.join("\n")).toContain("simulated write failure")
    expect(await readUtf8(filePath)).toBe(originalContents)
  })
})

async function makeTarget(): Promise<{ root: string; target: TargetConfig; targetDir: string }> {
  const root = await mkdtemp(path.join(tmpdir(), "harness-sync-"))
  roots.push(root)
  const targetDir = path.join(root, "opencode", "agents")
  return {
    root,
    target: { path: targetDir, scope: "project" },
    targetDir,
  }
}

function descriptor(
  id: string,
  hash: string,
  description = `Descriptor for ${id}`
): OpenCodeAgentDescriptor {
  return {
    id,
    roleId: `role:${id.replace(/^harness-/, "")}`,
    description,
    category: "subagent",
    recommendations: {
      guidance: `Use ${id} for tests`,
      skills: ["test-driven-development"],
      tools: ["read", "write"],
    },
    source: {
      hash,
      managedMarker: MANAGED_MARKER,
      sourceRole: id.replace(/^harness-/, ""),
    },
  }
}

async function syncWithDescriptors(
  target: TargetConfig,
  descriptors: OpenCodeAgentDescriptor[],
  options: Partial<SyncContractOptions> = {}
): Promise<SyncResult> {
  return syncFiles(target, {
    dryRun: false,
    backup: true,
    overwritePolicy: "backup",
    verbose: false,
    ...options,
    descriptors,
  } as SyncContractOptions)
}

function agentPath(targetDir: string, id: string): string {
  return path.join(targetDir, `${id}.md`)
}

async function readUtf8(filePath: string): Promise<string> {
  return readFile(filePath, "utf8")
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function sleepPastMtimeResolution(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 20))
}
