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

export const RoleManifestSchema = z.object({
  id: RoleIdSchema,
  name: RoleNameSchema,
  displayName: z.string().min(1),
  category: RoleCategorySchema,
  description: z.string().min(1),
  recommendedSkills: z.array(z.string()).default([]),
  recommendedTools: z.array(z.string()).default([]),
  guidance: z.string().min(1),
})

export type RoleManifestInput = z.input<typeof RoleManifestSchema>
export type RoleManifest = z.output<typeof RoleManifestSchema> & { readonly id: RoleId }

export function defineRoleManifest(manifest: RoleManifestInput): RoleManifest {
  return RoleManifestSchema.parse(manifest) as RoleManifest
}
