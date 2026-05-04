import type { EvidenceId, SessionId, TaskId } from "../types/ids"

export const EVIDENCE_STATE_VERSION = 1
export const EVIDENCE_STATE_NAMESPACE = "modus.evidence"

export interface EvidenceStateMetadata {
  readonly version: typeof EVIDENCE_STATE_VERSION
  readonly namespace: typeof EVIDENCE_STATE_NAMESPACE
  readonly maxPollingIntervalMs: number
  readonly staleDetectionThresholdMs: number
  readonly userVisibleNotices: {
    readonly missing: string
    readonly stale: string
  }
}

export const EVIDENCE_STATE_METADATA: EvidenceStateMetadata = {
  version: EVIDENCE_STATE_VERSION,
  namespace: EVIDENCE_STATE_NAMESPACE,
  maxPollingIntervalMs: 30_000,
  staleDetectionThresholdMs: 300_000,
  userVisibleNotices: {
    missing: "Evidence is unavailable or was not captured for this work item.",
    stale: "Evidence may be stale; rerun verification before relying on it.",
  },
}

export type EvidenceKind = "command" | "diagnostic" | "test" | "verification" | "user_notice"

export type EvidenceSource =
  | {
      readonly type: "command"
      readonly label: string
      readonly exitCode?: number
    }
  | {
      readonly type: "file"
      readonly path: string
      readonly line?: number
    }
  | {
      readonly type: "session"
      readonly sessionId: SessionId
      readonly messageId?: string
    }
  | {
      readonly type: "task"
      readonly taskId: TaskId
    }
  | {
      readonly type: "notice"
      readonly label: string
    }

export interface EvidenceReference {
  readonly version: typeof EVIDENCE_STATE_VERSION
  readonly namespace: typeof EVIDENCE_STATE_NAMESPACE
  readonly evidenceId: EvidenceId
  readonly kind: EvidenceKind
  readonly summary: string
  readonly createdAt: string
  readonly source: EvidenceSource
  readonly details?: string
}

export function serializeEvidenceReference(reference: EvidenceReference): string {
  return JSON.stringify(reference)
}
