import { z } from "zod"
import { createRoleId, isRoleId, type RoleId } from "../types/ids"
import type { RoleCategory, RoleName } from "../types/roles"

export const RoleNameSchema = z.enum([
  "architect",
  "planner",
  "executor",
  "agile-high",
  "agile-low",
  "introspective",
  "researcher",
  "explorer",
  "programmer-low",
  "programmer-medium",
  "programmer-high",
  "multi-modal-assistant",
  "reviewer",
  "tester",
  "documentation",
] satisfies [RoleName, ...RoleName[]])

export const RoleCategorySchema = z.enum(["primary", "subagent"] satisfies [
  RoleCategory,
  ...RoleCategory[],
])

const RoleIdSchema = z
  .string()
  .refine(isRoleId, { message: "role id must be a non-empty string" })
  .transform((value) => createRoleId(value))

const CapabilityRecommendationSchema = z.object({
  modalities: z.array(z.enum(["text", "vision", "audio", "code"])).default(["text"]),
  reasoningLevel: z.enum(["none", "basic", "extended", "deep"]),
  toolUseLevel: z.enum(["none", "limited", "full"]),
  contextWindow: z.enum(["standard", "large", "very-large"]).default("standard"),
})

const SkillExposureMetadataSchema = z.object({
  mode: z.literal("metadata-only").default("metadata-only"),
  recommendedSkills: z.array(z.string()).default([]),
  notes: z.string().optional(),
})

const ToolExposureMetadataSchema = z.object({
  mode: z.literal("metadata-only").default("metadata-only"),
  recommendedTools: z.array(z.string()).default([]),
  notes: z.string().optional(),
})

const DelegationGuidanceSchema = z.object({
  canDelegate: z.boolean().default(false),
  delegatesTo: z.array(RoleNameSchema).default([]),
  acceptsDelegationFrom: z.array(RoleNameSchema).default([]),
  guidance: z.string().min(1),
})

export const RoleManifestSchema = z.object({
  id: RoleIdSchema,
  name: RoleNameSchema,
  neutralName: z.string().min(1),
  category: RoleCategorySchema,
  description: z.string().min(1),
  recommendedCapabilities: CapabilityRecommendationSchema,
  defaultSkillExposure: SkillExposureMetadataSchema,
  defaultToolExposure: ToolExposureMetadataSchema,
  delegationGuidance: DelegationGuidanceSchema,
})

export type RoleManifestInput = z.input<typeof RoleManifestSchema>
export type RoleManifest = z.output<typeof RoleManifestSchema> & { readonly id: RoleId }

export function defineRoleManifest(manifest: RoleManifestInput): RoleManifest {
  return RoleManifestSchema.parse(manifest) as RoleManifest
}
