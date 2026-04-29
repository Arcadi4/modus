import { z } from "zod"

/**
 * Scope defines where generated files should be materialized.
 */
export const TargetScopeSchema = z.enum(["global", "project", "user"])

export type TargetScope = z.infer<typeof TargetScopeSchema>

/**
 * Target configuration for materialization.
 */
export const TargetConfigSchema = z.object({
  path: z.string().min(1),
  scope: TargetScopeSchema.default("project"),
})

export type TargetConfig = z.infer<typeof TargetConfigSchema>

/**
 * Metadata for a generated file.
 */
export const GeneratedFileMetaSchema = z.object({
  hash: z.string().min(1),
  managedMarker: z.string().default("<!-- MANAGED BY HARNESS -->"),
  sourceRole: z.string().optional(),
  generatedAt: z.string().optional(),
})

export type GeneratedFileMeta = z.infer<typeof GeneratedFileMetaSchema>

/**
 * Collision policy for handling existing files.
 */
export const CollisionPolicySchema = z.enum(["error", "skip", "overwrite", "backup"])

export type CollisionPolicy = z.infer<typeof CollisionPolicySchema>

/**
 * Options for sync operations.
 */
export const SyncOptionsSchema = z.object({
  dryRun: z.boolean().default(false),
  backup: z.boolean().default(true),
  overwritePolicy: CollisionPolicySchema.default("backup"),
  verbose: z.boolean().default(false),
})

export type SyncOptions = z.infer<typeof SyncOptionsSchema>

/**
 * Result of a single file sync operation.
 */
export const SyncOperationSchema = z.enum(["created", "updated", "skipped", "deleted", "refused"])

export type SyncOperation = z.infer<typeof SyncOperationSchema>

/**
 * Result of syncing a single file.
 */
export const SyncFileResultSchema = z.object({
  path: z.string(),
  operation: SyncOperationSchema,
  backupPath: z.string().optional(),
  reason: z.string().optional(),
})

export type SyncFileResult = z.infer<typeof SyncFileResultSchema>

/**
 * Overall sync result.
 */
export const SyncResultSchema = z.object({
  success: z.boolean(),
  files: z.array(SyncFileResultSchema),
  created: z.number().default(0),
  updated: z.number().default(0),
  skipped: z.number().default(0),
  deleted: z.number().default(0),
  refused: z.number().default(0),
  backups: z.array(z.string()).default([]),
  errors: z.array(z.string()).default([]),
})

export type SyncResult = z.infer<typeof SyncResultSchema>