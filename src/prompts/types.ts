import type { RoleName } from "../types/roles"

export type PromptSectionKind = "metadata" | "content" | "directive" | "reminder"

export interface PromptMetadata {
  readonly role: RoleName
  readonly intent: string
  readonly constraints: readonly string[]
  readonly formatHints: readonly string[]
}

export interface PromptContent {
  readonly objective: string
  readonly process: readonly string[]
  readonly output: readonly string[]
}

export interface PromptModule {
  readonly metadata: PromptMetadata
  readonly content: PromptContent
}

export interface PromptSection {
  readonly marker: string
  readonly kind: PromptSectionKind
  readonly lines: readonly string[]
}

export interface DirectiveOptions {
  readonly marker: string
  readonly text: string
}
