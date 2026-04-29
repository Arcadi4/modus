import { access, mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { renderAgentDefinition } from "./renderer"
import type { OpenCodeAgentDescriptor } from "./opencode-adapter"
import type { SyncOptions, SyncResult, SyncFileResult, TargetConfig } from "./types"

const DEFAULT_MANAGED_MARKER = "<!-- MANAGED BY HARNESS -->"

export interface SyncEngine {
  sync(target: TargetConfig, options: SyncOptions): Promise<SyncResult>
}

interface SyncContractOptions extends SyncOptions {
  descriptors: OpenCodeAgentDescriptor[]
  writeFile?: (filePath: string, contents: string) => Promise<void>
}

/**
 * Extracts hash from managed file content.
 * Looks for "Source hash: <hash>" line after the managed marker.
 */
function extractHash(content: string, marker: string): string | null {
  const markerIndex = content.indexOf(marker)
  if (markerIndex === -1) return null

  // Look for "Source hash: <hash>" pattern
  const hashMatch = content.match(/Source hash:\s*(\S+)/)
  return hashMatch?.[1] ?? null
}

/**
 * Checks if a file is managed by looking for the managed marker.
 */
function isManagedFile(content: string, marker: string): boolean {
  return content.includes(marker)
}

/**
 * Checks if managed file metadata is valid (has extractable hash).
 */
function hasValidManagedMetadata(content: string, marker: string): boolean {
  if (!isManagedFile(content, marker)) return false
  return extractHash(content, marker) !== null
}

/**
 * Gets the expected file path for an agent descriptor.
 */
function getAgentFilePath(targetDir: string, descriptor: OpenCodeAgentDescriptor): string {
  return path.join(targetDir, `${descriptor.id}.md`)
}

async function atomicWrite(
  filePath: string,
  contents: string,
  customWriteFile?: (filePath: string, contents: string) => Promise<void>
): Promise<void> {
  const dir = path.dirname(filePath)
  const tempPath = path.join(dir, `.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const writeFn = customWriteFile ?? writeFile

  try {
    await writeFn(tempPath, contents)
    await rename(tempPath, filePath)
  } catch (error) {
    try {
      await rm(tempPath, { force: true })
    } catch {
      // Ignore cleanup errors
    }
    throw error
  }
}

/**
 * Creates a backup of an existing file.
 */
async function createBackup(filePath: string): Promise<string> {
  const backupPath = `${filePath}.backup-${Date.now()}`
  const content = await readFile(filePath, "utf8")
  await writeFile(backupPath, content, "utf8")
  return backupPath
}

/**
 * Checks if a file exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Syncs agent descriptors to target directory.
 * Implements idempotent sync with atomic writes, stale cleanup, and collision handling.
 */
export async function syncFiles(
  target: TargetConfig,
  options: SyncContractOptions
): Promise<SyncResult> {
  const { descriptors, dryRun, backup, overwritePolicy, writeFile: customWriteFile } = options
  const targetDir = target.path
  const marker = DEFAULT_MANAGED_MARKER

  const result: SyncResult = {
    success: true,
    files: [],
    created: 0,
    updated: 0,
    skipped: 0,
    deleted: 0,
    refused: 0,
    backups: [],
    errors: [],
  }

  // Track which files should exist after sync
  const expectedFiles = new Set<string>()
  for (const descriptor of descriptors) {
    expectedFiles.add(getAgentFilePath(targetDir, descriptor))
  }

  // Ensure target directory exists (unless dry-run)
  if (!dryRun) {
    try {
      await mkdir(targetDir, { recursive: true })
    } catch (error) {
      result.success = false
      result.errors.push(`Failed to create target directory: ${error}`)
      return result
    }
  }

  // Process each descriptor
  for (const descriptor of descriptors) {
    const filePath = getAgentFilePath(targetDir, descriptor)
    const renderedContent = renderAgentDefinition(descriptor)
    const newHash = descriptor.source.hash

    const fileResult: SyncFileResult = {
      path: filePath,
      operation: "created",
    }

    try {
      const exists = await fileExists(filePath)

      if (!exists) {
        // Create new file
        if (dryRun) {
          fileResult.operation = "created"
          fileResult.reason = "dry-run: would create"
        } else {
          const writeFn = customWriteFile ?? atomicWrite
          await writeFn(filePath, renderedContent)
          fileResult.operation = "created"
        }
        result.created++
      } else {
        // File exists - check if managed
        const existingContent = await readFile(filePath, "utf8")

        if (!isManagedFile(existingContent, marker)) {
          // Unmanaged collision
          if (overwritePolicy === "error") {
            fileResult.operation = "refused"
            fileResult.reason = "unmanaged file collision"
            result.refused++
            result.success = false
          } else if (overwritePolicy === "skip") {
            fileResult.operation = "skipped"
            fileResult.reason = "unmanaged file collision - skipped"
            result.skipped++
          } else {
            // backup or overwrite - treat as unmanaged collision and refuse by default
            fileResult.operation = "refused"
            fileResult.reason = "unmanaged file collision"
            result.refused++
            result.success = false
          }
        } else {
          // Managed file - check if valid
          if (!hasValidManagedMetadata(existingContent, marker)) {
            fileResult.operation = "refused"
            fileResult.reason = "malformed managed file metadata"
            result.refused++
            result.success = false
          } else {
            const existingHash = extractHash(existingContent, marker)

            if (existingHash === newHash) {
              // Unchanged - skip
              fileResult.operation = "skipped"
              fileResult.reason = "hash unchanged"
              result.skipped++
      } else {
        // Changed - update
        if (dryRun) {
          fileResult.operation = "updated"
          fileResult.reason = "dry-run: would update"
          result.updated++
        } else {
          if (overwritePolicy === "error") {
            fileResult.operation = "refused"
            fileResult.reason = "no-overwrite policy"
            result.refused++
            result.success = false
          } else {
            // Create backup if enabled
            if (backup && overwritePolicy === "backup") {
              try {
                const backupPath = await createBackup(filePath)
                fileResult.backupPath = backupPath
                result.backups.push(backupPath)
              } catch (backupError) {
                fileResult.operation = "refused"
                fileResult.reason = `backup failed: ${backupError}`
                result.refused++
                result.success = false
                result.files.push(fileResult)
                continue
              }
            }

            // Always use atomic write for updates to protect original file
            await atomicWrite(filePath, renderedContent, customWriteFile)
            fileResult.operation = "updated"
            result.updated++
          }
        }
      }
          }
        }
      }
    } catch (error) {
      fileResult.operation = "refused"
      fileResult.reason = `write failed: ${error}`
      result.refused++
      result.success = false
      result.errors.push(`Failed to sync ${descriptor.id}: ${error}`)
    }

    result.files.push(fileResult)
  }

  // Delete stale managed files
  try {
    // Only scan if directory exists
    let existingFiles: string[] = []
    try {
      existingFiles = await readdir(targetDir)
    } catch {
      // Directory doesn't exist yet
    }

    for (const fileName of existingFiles) {
      if (!fileName.endsWith(".md")) continue

      const filePath = path.join(targetDir, fileName)

      // Skip if this file is in expected set
      if (expectedFiles.has(filePath)) continue

      try {
        const content = await readFile(filePath, "utf8")

        // Only delete managed files
        if (isManagedFile(content, marker)) {
          const fileResult: SyncFileResult = {
            path: filePath,
            operation: "deleted",
          }

          if (dryRun) {
            fileResult.reason = "dry-run: would delete stale file"
          } else {
            await rm(filePath)
          }

          result.deleted++
          result.files.push(fileResult)
        }
      } catch {
        // Skip files we can't read
      }
    }
  } catch (error) {
    result.errors.push(`Failed to clean up stale files: ${error}`)
  }

  return result
}
