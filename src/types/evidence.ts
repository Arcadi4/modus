import type { EvidenceId, TaskId } from "./ids"

export type EvidenceType =
  | "code-change"
  | "test-result"
  | "documentation"
  | "research-findings"
  | "review-feedback"
  | "execution-log"
  | "error-log"
  | "configuration"

export type EvidenceStatus = "pending" | "captured" | "validated" | "archived"

export interface EvidenceMetadata {
  readonly source?: string
  readonly tags?: readonly string[]
  readonly [key: string]: unknown
}

export interface EvidenceRecord {
  id: EvidenceId
  taskId: TaskId
  type: EvidenceType
  status: EvidenceStatus
  content: string
  timestamp: number
  metadata: EvidenceMetadata
}

export function createEvidenceRecord(
  id: EvidenceId,
  taskId: TaskId,
  type: EvidenceType,
  content: string,
  metadata: EvidenceMetadata = {}
): EvidenceRecord {
  return {
    id,
    taskId,
    type,
    status: "pending",
    content,
    timestamp: Date.now(),
    metadata,
  }
}

export function markEvidenceCaptured(record: EvidenceRecord): EvidenceRecord {
  return { ...record, status: "captured" }
}

export function markEvidenceValidated(record: EvidenceRecord): EvidenceRecord {
  return { ...record, status: "validated" }
}

export function markEvidenceArchived(record: EvidenceRecord): EvidenceRecord {
  return { ...record, status: "archived" }
}

export function isEvidenceOfType<T extends EvidenceType>(
  record: EvidenceRecord,
  type: T
): record is EvidenceRecord & { type: T } {
  return record.type === type
}
