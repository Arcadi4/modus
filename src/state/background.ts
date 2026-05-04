import type { EvidenceId, SessionId, TaskId } from "../types/ids"
import type { SessionRecord } from "./session"

export const BACKGROUND_STATE_VERSION = 1
export const BACKGROUND_STATE_NAMESPACE = "modus.background"

export interface BackgroundStateMetadata {
  readonly version: typeof BACKGROUND_STATE_VERSION
  readonly namespace: typeof BACKGROUND_STATE_NAMESPACE
  readonly maxPollingIntervalMs: number
  readonly staleDetectionThresholdMs: number
  readonly userVisibleNotices: {
    readonly started: string
    readonly stale: string
    readonly cancelled: string
    readonly resumed: string
  }
}

export const BACKGROUND_STATE_METADATA: BackgroundStateMetadata = {
  version: BACKGROUND_STATE_VERSION,
  namespace: BACKGROUND_STATE_NAMESPACE,
  maxPollingIntervalMs: 30_000,
  staleDetectionThresholdMs: 300_000,
  userVisibleNotices: {
    started: "Background work started in a child session.",
    stale: "Background work is stale; inspect the child session before continuing.",
    cancelled: "Background work cancellation was requested.",
    resumed: "Background work can be resumed from the stored token.",
  },
}

export type BackgroundTaskStatus =
  | "queued"
  | "running"
  | "completed"
  | "cancelled"
  | "failed"
  | "stale"

export type CancellationReason = "user_requested" | "superseded" | "stale" | "failed" | "policy"

export interface CancellationRequest {
  readonly requestedAt: string
  readonly requestedBySessionId: SessionId
  readonly reason: CancellationReason
  readonly userVisibleNotice: string
}

export interface ResumeToken {
  readonly token: string
  readonly issuedAt: string
  readonly expiresAt?: string
  readonly sessionId: SessionId
  readonly checkpointTaskId?: TaskId
}

export interface BackgroundTaskHandle {
  readonly version: typeof BACKGROUND_STATE_VERSION
  readonly namespace: typeof BACKGROUND_STATE_NAMESPACE
  readonly handleId: TaskId
  readonly parentSessionId: SessionId
  readonly childSession: SessionRecord
  readonly status: BackgroundTaskStatus
  readonly createdAt: string
  readonly updatedAt: string
  readonly cancellation?: CancellationRequest
  readonly resumeToken?: ResumeToken
  readonly evidenceIds?: readonly EvidenceId[]
  readonly lastPolledAt?: string
  readonly staleAfter?: string
  readonly userVisibleNotice?: string
}

export function serializeBackgroundTaskHandle(handle: BackgroundTaskHandle): string {
  return JSON.stringify(handle)
}
