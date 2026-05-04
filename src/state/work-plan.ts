import type { EvidenceId, SessionId, TaskId } from "../types/ids"

export const WORK_PLAN_STATE_VERSION = 1
export const WORK_PLAN_STATE_NAMESPACE = "modus.work-plan"

export interface WorkPlanStateMetadata {
  readonly version: typeof WORK_PLAN_STATE_VERSION
  readonly namespace: typeof WORK_PLAN_STATE_NAMESPACE
  readonly maxPollingIntervalMs: number
  readonly staleDetectionThresholdMs: number
  readonly userVisibleNotices: {
    readonly stalled: string
    readonly cancelled: string
  }
}

export const WORK_PLAN_STATE_METADATA: WorkPlanStateMetadata = {
  version: WORK_PLAN_STATE_VERSION,
  namespace: WORK_PLAN_STATE_NAMESPACE,
  maxPollingIntervalMs: 30_000,
  staleDetectionThresholdMs: 300_000,
  userVisibleNotices: {
    stalled: "Work appears stalled; verify the active task before continuing.",
    cancelled: "Work was cancelled and will not continue automatically.",
  },
}

interface TaskProgressBase {
  readonly taskId: TaskId
  readonly title: string
  readonly evidenceIds?: readonly EvidenceId[]
  readonly userVisibleNotice?: string
}

export type TaskProgress =
  | (TaskProgressBase & {
      readonly status: "pending"
    })
  | (TaskProgressBase & {
      readonly status: "in_progress"
      readonly startedAt: string
    })
  | (TaskProgressBase & {
      readonly status: "completed"
      readonly startedAt: string
      readonly completedAt: string
    })
  | (TaskProgressBase & {
      readonly status: "cancelled"
      readonly cancelledAt: string
      readonly cancellationReason: string
    })

export interface WorkPlan {
  readonly version: typeof WORK_PLAN_STATE_VERSION
  readonly namespace: typeof WORK_PLAN_STATE_NAMESPACE
  readonly planId: TaskId
  readonly title: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly tasks: readonly TaskProgress[]
  readonly description?: string
  readonly evidenceIds?: readonly EvidenceId[]
}

export interface ActiveWorkState {
  readonly version: typeof WORK_PLAN_STATE_VERSION
  readonly namespace: typeof WORK_PLAN_STATE_NAMESPACE
  readonly activePlan: WorkPlan
  readonly sessionId: SessionId
  readonly currentTaskId?: TaskId
  readonly notices: readonly string[]
  readonly lastObservedAt?: string
  readonly staleAfter?: string
}

export function serializeActiveWorkState(state: ActiveWorkState): string {
  return JSON.stringify(state)
}
