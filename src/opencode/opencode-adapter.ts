import { roleManifestList } from "../roles"
import type { RoleManifest } from "../roles/schema"
import type { GeneratedFileMeta } from "./types"
import { GeneratedFileMetaSchema } from "./types"

/**
 * Descriptor for a generated OpenCode agent.
 * Renders capability/profile data as recommendation metadata, not policy enforcement.
 */
export interface OpenCodeAgentDescriptor {
  /** Unique identifier with harness-* prefix to avoid native agent name collisions */
  id: string
  /** Original role identifier */
  roleId: string
  /** Human-readable description */
  description: string
  /** Category: primary or subagent */
  category: "primary" | "subagent"
  /** Recommendations as metadata, not enforcement */
  recommendations: {
    skills?: string[]
    tools?: string[]
    guidance?: string
  }
  /** Source manifest metadata */
  source: GeneratedFileMeta
}

/**
 * Generates OpenCode agent descriptors from role manifests.
 * Each descriptor uses harness-* prefix to avoid native agent name collisions.
 */
export function generateOpenCodeDescriptors(): OpenCodeAgentDescriptor[] {
  return roleManifestList.map((manifest) => mapManifestToDescriptor(manifest))
}

/**
 * Maps a single role manifest to an OpenCode agent descriptor.
 */
function mapManifestToDescriptor(manifest: RoleManifest): OpenCodeAgentDescriptor {
  const id = `harness-${manifest.name}`

  return {
    id,
    roleId: manifest.id as string,
    description: manifest.description,
    category: manifest.category,
    recommendations: {
      skills: manifest.defaultSkillExposure.recommendedSkills,
      tools: manifest.defaultToolExposure.recommendedTools,
      guidance: manifest.delegationGuidance.guidance,
    },
    source: {
      hash: generateHash(manifest),
      managedMarker: "<!-- MANAGED BY HARNESS -->",
      sourceRole: manifest.name,
    },
  }
}

/**
 * Simple hash for source tracking.
 * Uses role name and description to generate deterministic hash.
 */
function generateHash(manifest: RoleManifest): string {
  const str = `${manifest.id as string}:${manifest.name}:${manifest.description}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

/**
 * Validates descriptor count matches expected 15 (6 primary + 9 subagents).
 */
export function validateDescriptorCount(
  descriptors: OpenCodeAgentDescriptor[]
): { valid: boolean; actual: number; expected: number } {
  const expected = 15
  const actual = descriptors.length
  return {
    valid: actual === expected,
    actual,
    expected,
  }
}

/**
 * Validates all descriptor IDs have harness- prefix.
 */
export function validateHarnessPrefix(
  descriptors: OpenCodeAgentDescriptor[]
): { valid: boolean; invalidIds: string[] } {
  const invalidIds = descriptors
    .filter((d) => !d.id.startsWith("harness-"))
    .map((d) => d.id)

  return {
    valid: invalidIds.length === 0,
    invalidIds,
  }
}

/**
 * Validates descriptor IDs contain only safe filename characters.
 * Safe: lowercase letters, numbers, hyphens.
 */
export function validateSafeIds(
  descriptors: OpenCodeAgentDescriptor[]
): { valid: boolean; unsafeIds: string[] } {
  const safePattern = /^[a-z0-9-]+$/
  const unsafeIds = descriptors
    .filter((d) => !safePattern.test(d.id))
    .map((d) => d.id)

  return {
    valid: unsafeIds.length === 0,
    unsafeIds,
  }
}

/**
 * Verifies deterministic generation: same input produces same output.
 */
export function verifyDeterministic(): boolean {
  const first = generateOpenCodeDescriptors()
  const second = generateOpenCodeDescriptors()

  if (first.length !== second.length) {
    return false
  }

  for (let i = 0; i < first.length; i++) {
    if (first[i].id !== second[i].id) {
      return false
    }
    if (first[i].description !== second[i].description) {
      return false
    }
  }

  return true
}