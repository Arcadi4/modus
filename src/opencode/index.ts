export * from "./types"

export type {
  TargetConfig,
  GeneratedFileMeta,
  CollisionPolicy,
  SyncOptions,
  SyncOperation,
  SyncFileResult,
  SyncResult,
} from "./types"

export { syncFiles } from "./sync"
export type { SyncEngine } from "./sync"

export { renderAgentDefinition } from "./renderer"
export type { Renderer } from "./renderer"

export { generateOpenCodeDescriptors, validateDescriptorCount, validateHarnessPrefix, validateSafeIds, verifyDeterministic } from "./opencode-adapter"
export type { OpenCodeAgentDescriptor } from "./opencode-adapter"