interface Brand<T, B> {
  readonly __brand: B
  readonly __value: T
}

type BrandId<T extends string> = string & Brand<T, unknown>

export type RoleId = BrandId<"RoleId">
export type SessionId = BrandId<"SessionId">
export type TaskId = BrandId<"TaskId">
export type EvidenceId = BrandId<"EvidenceId">

export function createRoleId(value: string): RoleId {
  return value as RoleId
}

export function createSessionId(value: string): SessionId {
  return value as SessionId
}

export function createTaskId(value: string): TaskId {
  return value as TaskId
}

export function createEvidenceId(value: string): EvidenceId {
  return value as EvidenceId
}

export function isRoleId(value: string): boolean {
  return typeof value === "string" && value.length > 0
}

export function isSessionId(value: string): boolean {
  return typeof value === "string" && value.length > 0
}

export function isTaskId(value: string): boolean {
  return typeof value === "string" && value.length > 0
}

export function isEvidenceId(value: string): boolean {
  return typeof value === "string" && value.length > 0
}

export type AnyId = RoleId | SessionId | TaskId | EvidenceId
