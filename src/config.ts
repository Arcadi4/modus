import { z } from "zod"

const PromptVerbositySchema = z.string().refine(
  (val) => ["minimal", "normal", "verbose"].includes(val),
  { message: 'promptVerbosity must be "minimal", "normal", or "verbose"' }
)

const RoleProfileSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  customInstructions: z.string().optional(),
  modelOverride: z.string().optional(),
})

const ExtensionToggleSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  config: z.record(z.string(), z.unknown()).optional(),
})

const ModelCapabilitiesSchema = z.object({
  supportsStreaming: z.boolean().default(false),
  supportsTools: z.boolean().default(false),
  maxTokens: z.number().int().positive().optional(),
  supportsVision: z.boolean().default(false),
  supportsJsonMode: z.boolean().default(false),
})

export const HarnessPluginConfigSchema = z.object({
  envPrefix: z.string().min(1).default("HARNESS"),
  roleProfiles: z.record(z.string(), RoleProfileSettingsSchema).optional(),
  promptVerbosity: PromptVerbositySchema.default("normal"),
  extensionToggles: z.record(z.string(), ExtensionToggleSettingsSchema).optional(),
  modelCapabilities: ModelCapabilitiesSchema.optional(),
})

export type HarnessPluginConfig = z.infer<typeof HarnessPluginConfigSchema>

export function loadConfig(): HarnessPluginConfig {
  const parsed = HarnessPluginConfigSchema.parse({})
  return {
    ...parsed,
    modelCapabilities: parsed.modelCapabilities ?? {
      supportsStreaming: false,
      supportsTools: false,
      supportsVision: false,
      supportsJsonMode: false,
    },
  }
}