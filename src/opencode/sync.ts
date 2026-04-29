import type { SyncOptions, SyncResult, TargetConfig } from "./types"

export interface SyncEngine {
  sync(target: TargetConfig, options: SyncOptions): Promise<SyncResult>
}

export async function syncFiles(
  _target: TargetConfig,
  _options: SyncOptions
): Promise<SyncResult> {
  return {
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
}