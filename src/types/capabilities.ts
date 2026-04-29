export type Modality = "text" | "vision" | "audio" | "code"

export type ReasoningLevel = "none" | "basic" | "extended" | "deep"

export type ToolUseLevel = "none" | "limited" | "full"

export interface ContextWindow {
  inputTokens: number
  outputTokens: number
}

export interface ModelCapabilityProfile {
  provider: string
  modelName: string
  contextWindow: ContextWindow
  supportedModalities: readonly Modality[]
  reasoningLevel: ReasoningLevel
  toolUseLevel: ToolUseLevel
  maxFunctionCalls: number
  supportsStreaming: boolean
  supportsJsonMode: boolean
}

export function hasVisionSupport(profile: ModelCapabilityProfile): boolean {
  return profile.supportedModalities.includes("vision")
}

export function hasAudioSupport(profile: ModelCapabilityProfile): boolean {
  return profile.supportedModalities.includes("audio")
}

export function canUseTools(profile: ModelCapabilityProfile): boolean {
  return profile.toolUseLevel !== "none"
}

export function canUseExtendedReasoning(profile: ModelCapabilityProfile): boolean {
  return profile.reasoningLevel === "extended" || profile.reasoningLevel === "deep"
}

export type CapabilityLevel = "minimal" | "standard" | "enhanced" | "maximum"

export function getCapabilityLevel(profile: ModelCapabilityProfile): CapabilityLevel {
  let score = 0

  if (profile.supportedModalities.length > 1) score += 1
  if (profile.reasoningLevel === "extended" || profile.reasoningLevel === "deep") score += 1
  if (profile.toolUseLevel === "full") score += 1
  if (profile.contextWindow.inputTokens >= 100000) score += 1

  if (score <= 1) return "minimal"
  if (score === 2) return "standard"
  if (score === 3) return "enhanced"
  return "maximum"
}
