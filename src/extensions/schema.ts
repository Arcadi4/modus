import { z } from "zod"

export const ExtensionKindSchema = z.enum(["command", "tool", "hook"])

export const CommandSurfaceSchema = z.enum(["tui.command", "command.execute.before"])

export const ToolSurfaceSchema = z.enum([
  "tool",
  "tool.definition",
  "tool.execute.before",
  "tool.execute.after",
])

export const HookSurfaceSchema = z.enum([
  "auth",
  "chat.headers",
  "chat.message",
  "chat.params",
  "config",
  "event",
  "experimental.chat.messages.transform",
  "experimental.chat.system.transform",
  "experimental.compaction.autocontinue",
  "experimental.session.compacting",
  "experimental.text.complete",
  "provider.models",
  "shell.env",
])

const IdentifierSchema = z.string().min(1).regex(/^[a-z][a-z0-9._-]*$/)

export const CapabilityRequirementSchema = z.object({
  id: IdentifierSchema,
  reason: z.string().min(1),
  optional: z.boolean().default(false),
})

export const SafetyMetadataSchema = z.object({
  riskLevel: z.enum(["low", "medium", "high"]),
  touchesFilesystem: z.boolean().default(false),
  usesNetwork: z.boolean().default(false),
  requiresConfirmation: z.boolean().default(false),
  notes: z.string().min(1).optional(),
})

const BaseExtensionDescriptorSchema = z.object({
  id: IdentifierSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  capabilities: z.array(CapabilityRequirementSchema).default([]),
  safety: SafetyMetadataSchema,
  experimental: z.boolean(),
  minHostVersion: z.string().min(1).optional(),
  manifest: z.record(z.string(), z.unknown()).default({}),
})

export const CommandDescriptorSchema = BaseExtensionDescriptorSchema.extend({
  kind: z.literal("command"),
  surface: CommandSurfaceSchema,
  command: z.object({
    name: IdentifierSchema,
    usage: z.string().min(1),
  }),
})

export const ToolDescriptorSchema = BaseExtensionDescriptorSchema.extend({
  kind: z.literal("tool"),
  surface: ToolSurfaceSchema,
  tool: z.object({
    name: IdentifierSchema,
    inputSchema: z.record(z.string(), z.unknown()).default({}),
  }),
})

export const HookDescriptorSchema = BaseExtensionDescriptorSchema.extend({
  kind: z.literal("hook"),
  surface: HookSurfaceSchema,
  hook: z.object({
    name: HookSurfaceSchema,
    mutatesInput: z.boolean().default(false),
    mutatesOutput: z.boolean().default(false),
  }),
})

export const ExtensionDescriptorSchema = z
  .discriminatedUnion("kind", [
    CommandDescriptorSchema,
    ToolDescriptorSchema,
    HookDescriptorSchema,
  ])
  .superRefine((descriptor, context) => {
    const usesExperimentalSurface = descriptor.surface.startsWith("experimental.")
    if (usesExperimentalSurface && !descriptor.experimental) {
      context.addIssue({
        code: "custom",
        message: "experimental surfaces must set experimental to true",
        path: ["experimental"],
      })
    }

    if ((usesExperimentalSurface || descriptor.experimental) && !descriptor.minHostVersion) {
      context.addIssue({
        code: "custom",
        message: "experimental descriptors require minHostVersion metadata",
        path: ["minHostVersion"],
      })
    }
  })

export type ExtensionKind = z.infer<typeof ExtensionKindSchema>
export type CommandSurface = z.infer<typeof CommandSurfaceSchema>
export type ToolSurface = z.infer<typeof ToolSurfaceSchema>
export type HookSurface = z.infer<typeof HookSurfaceSchema>
export type CapabilityRequirement = z.infer<typeof CapabilityRequirementSchema>
export type SafetyMetadata = z.infer<typeof SafetyMetadataSchema>
export type CommandDescriptor = z.infer<typeof CommandDescriptorSchema>
export type ToolDescriptor = z.infer<typeof ToolDescriptorSchema>
export type HookDescriptor = z.infer<typeof HookDescriptorSchema>
export type ExtensionDescriptor = z.infer<typeof ExtensionDescriptorSchema>
