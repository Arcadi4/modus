import { z } from "zod"

const PromptVerbositySchema = z
  .string()
  .refine((val) => ["minimal", "normal", "verbose"].includes(val), {
    message: 'promptVerbosity must be "minimal", "normal", or "verbose"',
  })

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

const DcpDetectionPolicySchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    mode: z.enum(["any-signal"]).default("any-signal"),
    phase: z.enum(["launch-time"]).default("launch-time"),
  })
)

const DcpSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  submodulePath: z.string().default("vendor/opencode-dynamic-context-pruning"),
  pinnedTag: z.string().default("v3.1.9"),
  failureBehavior: z.enum(["warn-continue"]).default("warn-continue"),
  detectionPolicy: DcpDetectionPolicySchema,
})

export const ModusPluginConfigSchema = z.object({
  envPrefix: z.string().min(1).default("MODUS"),
  roleProfiles: z.record(z.string(), RoleProfileSettingsSchema).optional(),
  promptVerbosity: PromptVerbositySchema.default("normal"),
  extensionToggles: z.record(z.string(), ExtensionToggleSettingsSchema).optional(),
  dcp: z.preprocess((value) => value ?? {}, DcpSettingsSchema),
  modelCapabilities: ModelCapabilitiesSchema.optional(),
})

export type ModusPluginConfig = z.infer<typeof ModusPluginConfigSchema>
