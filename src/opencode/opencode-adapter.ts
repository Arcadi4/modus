import { roleManifestList } from "../roles"
import type { RoleManifest } from "../roles/schema"
import {
  architectWorkflowPrompt,
  executorWorkflowPrompt,
  plannerWorkflowPrompt,
} from "../prompts/workflow"
import type { GeneratedFileMeta } from "./types"

const WORKFLOW_AGENT_DEFINITIONS = [
  {
    id: "workflow-architect",
    roleId: "workflow:architect",
    description:
      "Shapes user goals into coherent designs through critical dialogue, context gathering, and explicit tradeoffs.",
    prompt: architectWorkflowPrompt,
  },
  {
    id: "workflow-planner",
    roleId: "workflow:planner",
    description:
      "Turns approved designs into executable plans with atomic tasks, dependencies, and verification evidence.",
    prompt: plannerWorkflowPrompt,
  },
  {
    id: "workflow-executor",
    roleId: "workflow:executor",
    description:
      "Executes existing plans in verified units by delegating work, checking acceptance criteria, and recording evidence.",
    prompt: executorWorkflowPrompt,
  },
] as const

export const WORKFLOW_AGENT_COUNT = WORKFLOW_AGENT_DEFINITIONS.length
export const EXPECTED_OPENCODE_DESCRIPTOR_COUNT = roleManifestList.length + WORKFLOW_AGENT_COUNT

/**
 * Descriptor for a generated OpenCode agent.
 * Renders capability/profile data as recommendation metadata, not policy enforcement.
 */
export interface OpenCodeAgentDescriptor {
  /** Unique identifier without brand prefix to avoid native agent name collisions */
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
  /** Full OpenCode prompt content for prompt-backed workflow agents */
  prompt?: string
  /** Source manifest metadata */
  source: GeneratedFileMeta
}

/**
 * Generates OpenCode agent descriptors from role manifests.
 * Each descriptor uses the role name directly without brand prefix.
 */
export function generateOpenCodeDescriptors(): OpenCodeAgentDescriptor[] {
  return [
    ...roleManifestList.map((manifest) => mapManifestToDescriptor(manifest)),
    ...generateWorkflowAgentDescriptors(),
  ]
}

export function generateWorkflowAgentDescriptors(): OpenCodeAgentDescriptor[] {
  return WORKFLOW_AGENT_DEFINITIONS.map((definition) => ({
    id: definition.id,
    roleId: definition.roleId,
    description: definition.description,
    category: "primary",
    recommendations: {
      guidance: "Follow the embedded workflow prompt for this core workflow agent.",
    },
    prompt: definition.prompt,
    source: {
      hash: generateWorkflowHash(definition),
      managedMarker: "<!-- MANAGED BY MODUS -->",
      sourceRole: definition.roleId,
    },
  }))
}

/**
 * Maps a single role manifest to an OpenCode agent descriptor.
 */
function mapManifestToDescriptor(manifest: RoleManifest): OpenCodeAgentDescriptor {
  const id = manifest.name

  return {
    id,
    roleId: manifest.id as string,
    description: manifest.description,
    category: manifest.category,
    recommendations: {
      skills: manifest.recommendedSkills,
      tools: manifest.recommendedTools,
      guidance: manifest.guidance,
    },
    source: {
      hash: generateHash(manifest),
      managedMarker: "<!-- MANAGED BY MODUS -->",
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
  return hashString(str)
}

function generateWorkflowHash(definition: (typeof WORKFLOW_AGENT_DEFINITIONS)[number]): string {
  return hashString(`${definition.roleId}:${definition.id}:${definition.description}:${definition.prompt}`)
}

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

/**
 * Validates descriptor count matches expected 18 (15 role manifests + 3 workflow agents).
 */
export function validateDescriptorCount(descriptors: OpenCodeAgentDescriptor[]): {
  valid: boolean
  actual: number
  expected: number
} {
  const expected = EXPECTED_OPENCODE_DESCRIPTOR_COUNT
  const actual = descriptors.length
  return {
    valid: actual === expected,
    actual,
    expected,
  }
}

/**
 * Validates all descriptor IDs contain no brand prefix.
 */
export function validateModusPrefix(descriptors: OpenCodeAgentDescriptor[]): {
  valid: boolean
  invalidIds: string[]
} {
  const invalidIds = descriptors
    .filter((d) => d.id.startsWith("harness-") || d.id.startsWith("modus-"))
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
export function validateSafeIds(descriptors: OpenCodeAgentDescriptor[]): {
  valid: boolean
  unsafeIds: string[]
} {
  const safePattern = /^[a-z0-9-]+$/
  const unsafeIds = descriptors.filter((d) => !safePattern.test(d.id)).map((d) => d.id)

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
  return JSON.stringify(first) === JSON.stringify(second)
}
