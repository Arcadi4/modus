import type { Plugin } from "@opencode-ai/plugin"

import { loadConfig } from "./config"
import { createShellEnvHook } from "./hooks/shell-env"

export { HarnessPluginConfigSchema, loadConfig } from "./config"
export type { HarnessPluginConfig } from "./config"
export {
  getRoleManifest,
  roleManifestList,
  roleManifests,
} from "./roles"
export type { RoleManifest, RoleManifestInput } from "./roles"
export {
  buildDirective,
  buildPrompt,
  buildPromptSections,
  buildReminder,
  executionPrompt,
  planningPrompt,
} from "./prompts"
export type {
  DirectiveOptions,
  PromptContent,
  PromptMetadata,
  PromptModule,
  PromptSection,
  PromptSectionKind,
} from "./prompts"
export {
  BACKGROUND_STATE_METADATA,
  BACKGROUND_STATE_NAMESPACE,
  BACKGROUND_STATE_VERSION,
  EVIDENCE_STATE_METADATA,
  EVIDENCE_STATE_NAMESPACE,
  EVIDENCE_STATE_VERSION,
  SESSION_STATE_METADATA,
  SESSION_STATE_NAMESPACE,
  SESSION_STATE_VERSION,
  WORK_PLAN_STATE_METADATA,
  WORK_PLAN_STATE_NAMESPACE,
  WORK_PLAN_STATE_VERSION,
  serializeActiveWorkState,
  serializeBackgroundTaskHandle,
  serializeEvidenceReference,
  serializeSessionRecord,
} from "./state"
export type {
  ActiveWorkState,
  BackgroundStateMetadata,
  BackgroundTaskHandle,
  BackgroundTaskStatus,
  CancellationReason,
  CancellationRequest,
  EvidenceKind,
  EvidenceReference,
  EvidenceSource,
  EvidenceStateMetadata,
  ResumeToken,
  SessionRecord,
  SessionStateMetadata,
  SessionStatus,
  TaskProgress,
  WorkPlan,
  WorkPlanStateMetadata,
} from "./state"
export {
  CapabilityRequirementSchema,
  CommandDescriptorSchema,
  CommandSurfaceSchema,
  ExtensionDescriptorSchema,
  ExtensionKindSchema,
  HookDescriptorSchema,
  HookSurfaceSchema,
  SafetyMetadataSchema,
  ToolDescriptorSchema,
  ToolSurfaceSchema,
  createExtensionRegistry,
  exampleCommandDescriptor,
  exampleExtensionDescriptors,
  exampleHookDescriptor,
  exampleToolDescriptor,
} from "./extensions"
export type {
  CapabilityRequirement,
  CommandDescriptor,
  CommandSurface,
  ExtensionDescriptor,
  ExtensionKind,
  ExtensionRegistry,
  HookDescriptor,
  HookSurface,
  SafetyMetadata,
  ToolDescriptor,
  ToolSurface,
} from "./extensions"

/**
 * Server runtime entrypoint.
 * Exports server-safe plugin components that work in server environments.
 */
export const createServerPlugin = async (input: Parameters<Plugin>[0]) => {
  const config = loadConfig()
  const context = { input, config }

  return {
    name: "harness-runtime/server",
    ...createShellEnvHook(context),
  }
}

export default createServerPlugin
