import type { EvidenceId, SessionId, TaskId } from "../types/ids"

export const SESSION_STATE_VERSION = 1
export const SESSION_STATE_NAMESPACE = "modus.session"

export interface SessionStateMetadata {
  readonly version: typeof SESSION_STATE_VERSION
  readonly namespace: typeof SESSION_STATE_NAMESPACE
  readonly maxPollingIntervalMs: number
  readonly staleDetectionThresholdMs: number
  readonly userVisibleNotices: {
    readonly stale: string
    readonly disconnected: string
  }
}

export const SESSION_STATE_METADATA: SessionStateMetadata = {
  version: SESSION_STATE_VERSION,
  namespace: SESSION_STATE_NAMESPACE,
  maxPollingIntervalMs: 30_000,
  staleDetectionThresholdMs: 300_000,
  userVisibleNotices: {
    stale: "Session state is stale; refresh before continuing work.",
    disconnected: "Session is no longer connected to active work.",
  },
}

export type SessionStatus = "active" | "idle" | "completed" | "cancelled" | "failed"

export interface SessionRecord {
  readonly version: typeof SESSION_STATE_VERSION
  readonly namespace: typeof SESSION_STATE_NAMESPACE
  readonly sessionId: SessionId
  readonly role: string
  readonly status: SessionStatus
  readonly createdAt: string
  readonly updatedAt: string
  readonly parentSessionId?: SessionId
  readonly childSessionIds: readonly SessionId[]
  readonly activeTaskId?: TaskId
  readonly evidenceIds?: readonly EvidenceId[]
  readonly staleAfter?: string
  readonly userVisibleNotice?: string
}

export function serializeSessionRecord(record: SessionRecord): string {
  return JSON.stringify(record)
}
