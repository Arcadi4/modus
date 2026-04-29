import { describe, expect, it } from "vitest"
import { roleDefinitions } from "./types/roles"
import { RoleManifestSchema, roleManifests, roleManifestList, type RoleManifest } from "./roles"
import { HarnessPluginConfigSchema, loadConfig, type HarnessPluginConfig } from "./config"
import {
  buildPrompt,
  buildPromptSections,
  buildDirective,
  buildReminder,
  executionPrompt,
  planningPrompt,
  type PromptModule,
  type DirectiveOptions,
} from "./prompts"
import {
  createExtensionRegistry,
  ExtensionDescriptorSchema,
  CommandDescriptorSchema,
  ToolDescriptorSchema,
  HookDescriptorSchema,
  type ExtensionDescriptor,
} from "./extensions"
import type { RoleName } from "./types/roles"
import {
  TargetConfigSchema,
  GeneratedFileMetaSchema,
  CollisionPolicySchema,
  SyncOptionsSchema,
  SyncResultSchema,
  type TargetConfig,
  type GeneratedFileMeta,
  type CollisionPolicy,
  type SyncOptions,
  type SyncResult,
} from "./opencode"
import { syncFiles, type SyncEngine } from "./opencode/sync"
import { renderAgentDefinition, type Renderer } from "./opencode/renderer"
import {
  generateOpenCodeDescriptors,
  validateDescriptorCount,
  validateHarnessPrefix,
  validateSafeIds,
  verifyDeterministic,
  type OpenCodeAgentDescriptor,
} from "./opencode/opencode-adapter"

describe("scaffold integrity", () => {
  describe("module imports", () => {
    it("imports roles module", () => {
      expect(roleManifestList).toBeDefined()
      expect(roleManifests).toBeDefined()
      expect(RoleManifestSchema).toBeDefined()
    })

    it("imports config module", () => {
      const config = loadConfig()
      expect(config).toBeDefined()
      expect(HarnessPluginConfigSchema).toBeDefined()
    })

    it("imports prompts module", () => {
      expect(buildPrompt).toBeDefined()
      expect(buildPromptSections).toBeDefined()
      expect(buildDirective).toBeDefined()
      expect(buildReminder).toBeDefined()
      expect(executionPrompt).toBeDefined()
      expect(planningPrompt).toBeDefined()
    })

    it("imports extensions module", () => {
      expect(createExtensionRegistry).toBeDefined()
      expect(ExtensionDescriptorSchema).toBeDefined()
      expect(CommandDescriptorSchema).toBeDefined()
      expect(ToolDescriptorSchema).toBeDefined()
      expect(HookDescriptorSchema).toBeDefined()
    })
  })

  describe("manifest coverage", () => {
    it("provides a manifest for every role name in roleDefinitions", () => {
      const expectedRoleNames = Object.keys(roleDefinitions).sort()
      const manifestRoleNames = Object.keys(roleManifests).sort()

      expect(manifestRoleNames).toEqual(expectedRoleNames)
    })

    it("validates all manifests against schema", () => {
      for (const manifest of roleManifestList) {
        const parsed: RoleManifest = RoleManifestSchema.parse(manifest)
        expect(parsed.id).toBeDefined()
        expect(parsed.name).toBeDefined()
        expect(parsed.neutralName).toBeDefined()
        expect(parsed.category).toBeDefined()
        expect(parsed.description).toBeDefined()
        expect(parsed.recommendedCapabilities).toBeDefined()
        expect(parsed.defaultSkillExposure).toBeDefined()
        expect(parsed.defaultToolExposure).toBeDefined()
        expect(parsed.delegationGuidance).toBeDefined()
      }
    })

    it("has valid role categories", () => {
      for (const manifest of roleManifestList) {
        expect(["primary", "subagent"]).toContain(manifest.category)
      }
    })

    it("has valid capability recommendations", () => {
      for (const manifest of roleManifestList) {
        const caps = manifest.recommendedCapabilities
        expect(["text", "vision", "audio", "code"]).toContain(caps.modalities[0])
        expect(["none", "basic", "extended", "deep"]).toContain(caps.reasoningLevel)
        expect(["none", "limited", "full"]).toContain(caps.toolUseLevel)
        expect(["standard", "large", "very-large"]).toContain(caps.contextWindow)
      }
    })

    it("has valid delegation guidance", () => {
      for (const manifest of roleManifestList) {
        const guidance = manifest.delegationGuidance
        expect(typeof guidance.canDelegate).toBe("boolean")
        expect(Array.isArray(guidance.delegatesTo)).toBe(true)
        expect(Array.isArray(guidance.acceptsDelegationFrom)).toBe(true)
        expect(guidance.guidance.length).toBeGreaterThan(0)
      }
    })
  })

  describe("config defaults", () => {
    it("loads default config successfully", () => {
      const config = loadConfig()
      expect(config.envPrefix).toBe("HARNESS")
      expect(config.promptVerbosity).toBe("normal")
    })

    it("applies roleProfiles defaults", () => {
      const config = HarnessPluginConfigSchema.parse({
        roleProfiles: { developer: {} },
      })
      expect(config.roleProfiles?.developer?.enabled).toBe(true)
    })

    it("applies modelCapabilities defaults", () => {
      const config = loadConfig()
      expect(config.modelCapabilities?.supportsStreaming).toBe(false)
      expect(config.modelCapabilities?.supportsTools).toBe(false)
      expect(config.modelCapabilities?.supportsVision).toBe(false)
      expect(config.modelCapabilities?.supportsJsonMode).toBe(false)
    })

    it("accepts all valid promptVerbosity values", () => {
      const minimal = HarnessPluginConfigSchema.parse({ promptVerbosity: "minimal" })
      const normal = HarnessPluginConfigSchema.parse({ promptVerbosity: "normal" })
      const verbose = HarnessPluginConfigSchema.parse({ promptVerbosity: "verbose" })

      expect(minimal.promptVerbosity).toBe("minimal")
      expect(normal.promptVerbosity).toBe("normal")
      expect(verbose.promptVerbosity).toBe("verbose")
    })
  })

  describe("prompt builder determinism", () => {
    const createDeterministicModule = (): PromptModule => ({
      metadata: {
        role: "executor" as RoleName,
        intent: "Execute tasks directly",
        constraints: ["No unnecessary steps", "Direct execution"],
        formatHints: ["Concise output", "Action-oriented"],
      },
      content: {
        objective: "Execute the given task with minimal overhead",
        process: ["Analyze requirements", "Execute directly", "Return results"],
        output: ["Final result", "Status report"],
      },
    })

    it("produces consistent output for same input", () => {
      const module = createDeterministicModule()
      const first = buildPrompt(module)
      const second = buildPrompt(module)

      expect(first).toBe(second)
    })

    it("buildPromptSections returns correct number of sections", () => {
      const module = createDeterministicModule()
      const sections = buildPromptSections(module)

      expect(sections).toHaveLength(4)
      expect(sections.map((s) => s.marker)).toEqual([
        "metadata",
        "constraints",
        "format",
        "content",
      ])
    })

    it("buildDirective produces valid directive section", () => {
      const directive: DirectiveOptions = {
        marker: "reminder",
        text: "Always verify before proceeding",
      }
      const result = buildDirective(directive)

      expect(result).toContain("[REMINDER]")
      expect(result).toContain("Always verify before proceeding")
    })

    it("buildReminder produces valid reminder section", () => {
      const reminder: DirectiveOptions = {
        marker: "note",
        text: "Check for edge cases",
      }
      const result = buildReminder(reminder)

      expect(result).toContain("[NOTE]")
      expect(result).toContain("Check for edge cases")
    })

    it("executionPrompt and planningPrompt are valid modules", () => {
      expect(executionPrompt.metadata.role).toBeDefined()
      expect(executionPrompt.metadata.intent).toBeDefined()
      expect(executionPrompt.content.objective).toBeDefined()

      expect(planningPrompt.metadata.role).toBeDefined()
      expect(planningPrompt.metadata.intent).toBeDefined()
      expect(planningPrompt.content.objective).toBeDefined()
    })
  })

  describe("extension registry", () => {
    it("creates empty registry", () => {
      const registry = createExtensionRegistry()
      expect(registry.list()).toEqual([])
      expect(registry.commands.size).toBe(0)
      expect(registry.tools.size).toBe(0)
      expect(registry.hooks.size).toBe(0)
    })

    it("registers valid command descriptor", () => {
      const registry = createExtensionRegistry()
      const descriptor: ExtensionDescriptor = {
        id: "test-command",
        title: "Test Command",
        description: "A test command",
        kind: "command",
        surface: "tui.command",
        command: {
          name: "test",
          usage: "test [args]",
        },
        safety: {
          riskLevel: "low",
          touchesFilesystem: false,
          usesNetwork: false,
          requiresConfirmation: false,
        },
        experimental: false,
        capabilities: [],
        manifest: {},
      }

      const registered = registry.register(descriptor)
      expect(registered.id).toBe("test-command")
      expect(registry.commands.has("test-command")).toBe(true)
    })

    it("registers valid tool descriptor", () => {
      const registry = createExtensionRegistry()
      const descriptor: ExtensionDescriptor = {
        id: "test-tool",
        title: "Test Tool",
        description: "A test tool",
        kind: "tool",
        surface: "tool",
        tool: {
          name: "test-tool",
          inputSchema: { type: "object" },
        },
        safety: {
          riskLevel: "low",
          touchesFilesystem: false,
          usesNetwork: false,
          requiresConfirmation: false,
        },
        experimental: false,
        capabilities: [],
        manifest: {},
      }

      const registered = registry.register(descriptor)
      expect(registered.id).toBe("test-tool")
      expect(registry.tools.has("test-tool")).toBe(true)
    })

    it("registers valid hook descriptor", () => {
      const registry = createExtensionRegistry()
      const descriptor: ExtensionDescriptor = {
        id: "test-hook",
        title: "Test Hook",
        description: "A test hook",
        kind: "hook",
        surface: "shell.env",
        hook: {
          name: "shell.env",
          mutatesInput: false,
          mutatesOutput: false,
        },
        safety: {
          riskLevel: "low",
          touchesFilesystem: false,
          usesNetwork: false,
          requiresConfirmation: false,
        },
        experimental: false,
        capabilities: [],
        manifest: {},
      }

      const registered = registry.register(descriptor)
      expect(registered.id).toBe("test-hook")
      expect(registry.hooks.has("test-hook")).toBe(true)
    })

    it("list returns all registered descriptors", () => {
      const commandDesc: ExtensionDescriptor = {
        id: "cmd-1",
        title: "Command 1",
        description: "A command",
        kind: "command",
        surface: "tui.command",
        command: { name: "cmd1", usage: "cmd1" },
        safety: {
          riskLevel: "low",
          touchesFilesystem: false,
          usesNetwork: false,
          requiresConfirmation: false,
        },
        experimental: false,
        capabilities: [],
        manifest: {},
      }
      const toolDesc: ExtensionDescriptor = {
        id: "tool-1",
        title: "Tool 1",
        description: "A tool",
        kind: "tool",
        surface: "tool",
        tool: { name: "tool-1", inputSchema: {} },
        safety: {
          riskLevel: "low",
          touchesFilesystem: false,
          usesNetwork: false,
          requiresConfirmation: false,
        },
        experimental: false,
        capabilities: [],
        manifest: {},
      }

      const registry = createExtensionRegistry([commandDesc, toolDesc])
      const list = registry.list()

      expect(list).toHaveLength(2)
      expect(list.map((d) => d.id)).toContain("cmd-1")
      expect(list.map((d) => d.id)).toContain("tool-1")
    })

    it("throws on duplicate registration", () => {
      const registry = createExtensionRegistry()
      const descriptor: ExtensionDescriptor = {
        id: "duplicate-test",
        title: "Test",
        description: "Test",
        kind: "command",
        surface: "tui.command",
        command: { name: "test", usage: "test" },
        safety: {
          riskLevel: "low",
          touchesFilesystem: false,
          usesNetwork: false,
          requiresConfirmation: false,
        },
        experimental: false,
        capabilities: [],
        manifest: {},
      }

      registry.register(descriptor)
      expect(() => registry.register(descriptor)).toThrow(
        "Extension descriptor already registered: duplicate-test"
      )
    })
  })

  describe("invalid manifest rejection", () => {
    it("rejects manifest with missing required fields", () => {
      expect(() =>
        RoleManifestSchema.parse({
          id: "role:architect",
          name: "architect",
          // missing neutralName, category, description
        })
      ).toThrow()
    })

    it("rejects manifest with invalid role name", () => {
      const result = RoleManifestSchema.safeParse({
        id: "role:invalid",
        name: "invalid-role-name",
        neutralName: "Invalid Role",
        category: "primary",
        description: "An invalid role",
        recommendedCapabilities: {
          modalities: ["text"],
          reasoningLevel: "basic",
          toolUseLevel: "none",
          contextWindow: "standard",
        },
        defaultSkillExposure: {
          mode: "metadata-only",
          recommendedSkills: [],
        },
        defaultToolExposure: {
          mode: "metadata-only",
          recommendedTools: [],
        },
        delegationGuidance: {
          canDelegate: false,
          delegatesTo: [],
          acceptsDelegationFrom: [],
          guidance: "No delegation",
        },
      })
      expect(result.success).toBe(false)
    })

    it("rejects manifest with invalid category", () => {
      const result = RoleManifestSchema.safeParse({
        id: "role:test",
        name: "architect",
        neutralName: "Test",
        category: "invalid-category",
        description: "Test role",
        recommendedCapabilities: {
          modalities: ["text"],
          reasoningLevel: "basic",
          toolUseLevel: "none",
          contextWindow: "standard",
        },
        defaultSkillExposure: {
          mode: "metadata-only",
          recommendedSkills: [],
        },
        defaultToolExposure: {
          mode: "metadata-only",
          recommendedTools: [],
        },
        delegationGuidance: {
          canDelegate: false,
          delegatesTo: [],
          acceptsDelegationFrom: [],
          guidance: "Test",
        },
      })
      expect(result.success).toBe(false)
    })
  })

  describe("invalid config rejection", () => {
    it("rejects invalid promptVerbosity", () => {
      const result = HarnessPluginConfigSchema.safeParse({
        promptVerbosity: "invalid",
      })
      expect(result.success).toBe(false)
    })

    it("rejects negative maxTokens", () => {
      const result = HarnessPluginConfigSchema.safeParse({
        modelCapabilities: { maxTokens: -1 },
      })
      expect(result.success).toBe(false)
    })

    it("rejects zero maxTokens", () => {
      const result = HarnessPluginConfigSchema.safeParse({
        modelCapabilities: { maxTokens: 0 },
      })
      expect(result.success).toBe(false)
    })

    it("rejects empty envPrefix", () => {
      const result = HarnessPluginConfigSchema.safeParse({
        envPrefix: "",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("invalid extension descriptor rejection", () => {
    it("rejects descriptor with invalid id format", () => {
      const result = ExtensionDescriptorSchema.safeParse({
        id: "InvalidId",
        title: "Test",
        description: "Test",
        kind: "command",
        surface: "tui.command",
        command: { name: "test", usage: "test" },
        safety: {
          riskLevel: "low",
          touchesFilesystem: false,
          usesNetwork: false,
          requiresConfirmation: false,
        },
        experimental: false,
        capabilities: [],
        manifest: {},
      })
      expect(result.success).toBe(false)
    })

    it("rejects experimental surface without experimental flag", () => {
      const result = ExtensionDescriptorSchema.safeParse({
        id: "test-exp",
        title: "Test",
        description: "Test",
        kind: "hook",
        surface: "experimental.chat.messages.transform",
        hook: {
          name: "experimental.chat.messages.transform",
          mutatesInput: false,
          mutatesOutput: false,
        },
        safety: {
          riskLevel: "low",
          touchesFilesystem: false,
          usesNetwork: false,
          requiresConfirmation: false,
        },
        experimental: false,
        capabilities: [],
        manifest: {},
      })
      expect(result.success).toBe(false)
    })

    it("rejects experimental descriptor without minHostVersion", () => {
      const result = ExtensionDescriptorSchema.safeParse({
        id: "test-exp",
        title: "Test",
        description: "Test",
        kind: "hook",
        surface: "experimental.chat.messages.transform",
        hook: {
          name: "experimental.chat.messages.transform",
          mutatesInput: false,
          mutatesOutput: false,
        },
        safety: {
          riskLevel: "low",
          touchesFilesystem: false,
          usesNetwork: false,
          requiresConfirmation: false,
        },
        experimental: true,
        capabilities: [],
        manifest: {},
      })
      expect(result.success).toBe(false)
    })

    it("rejects invalid extension kind", () => {
      const result = ExtensionDescriptorSchema.safeParse({
        id: "test-invalid",
        title: "Test",
        description: "Test",
        kind: "invalid-kind",
        surface: "tool",
        tool: { name: "test", inputSchema: {} },
        safety: {
          riskLevel: "low",
          touchesFilesystem: false,
          usesNetwork: false,
          requiresConfirmation: false,
        },
        experimental: false,
        capabilities: [],
        manifest: {},
      })
      expect(result.success).toBe(false)
    })

    it("rejects invalid command surface", () => {
      const result = CommandDescriptorSchema.safeParse({
        id: "test-cmd",
        title: "Test",
        description: "Test",
        kind: "command",
        surface: "invalid-surface",
        command: { name: "test", usage: "test" },
        safety: {
          riskLevel: "low",
          touchesFilesystem: false,
          usesNetwork: false,
          requiresConfirmation: false,
        },
        experimental: false,
        capabilities: [],
        manifest: {},
      })
      expect(result.success).toBe(false)
    })

    it("rejects invalid tool surface", () => {
      const result = ToolDescriptorSchema.safeParse({
        id: "test-tool",
        title: "Test",
        description: "Test",
        kind: "tool",
        surface: "invalid-surface",
        tool: { name: "test", inputSchema: {} },
        safety: {
          riskLevel: "low",
          touchesFilesystem: false,
          usesNetwork: false,
          requiresConfirmation: false,
        },
        experimental: false,
        capabilities: [],
        manifest: {},
      })
      expect(result.success).toBe(false)
    })

    it("rejects invalid hook surface", () => {
      const result = HookDescriptorSchema.safeParse({
        id: "test-hook",
        title: "Test",
        description: "Test",
        kind: "hook",
        surface: "invalid-surface",
        hook: {
          name: "invalid-surface",
          mutatesInput: false,
          mutatesOutput: false,
        },
        safety: {
          riskLevel: "low",
          touchesFilesystem: false,
          usesNetwork: false,
          requiresConfirmation: false,
        },
        experimental: false,
        capabilities: [],
        manifest: {},
      })
      expect(result.success).toBe(false)
    })
  })

  describe("type exports", () => {
    it("exports HarnessPluginConfig type", () => {
      const config: HarnessPluginConfig = {
        envPrefix: "TEST",
        promptVerbosity: "minimal",
      }
      expect(config.envPrefix).toBe("TEST")
      expect(config.promptVerbosity).toBe("minimal")
    })

    it("exports RoleManifest type", () => {
      const manifest: RoleManifest = roleManifestList[0]
      expect(manifest.id).toBeDefined()
      expect(manifest.name).toBeDefined()
    })
  })

  describe("materialization module", () => {
    it("imports materialization types", () => {
      expect(TargetConfigSchema).toBeDefined()
      expect(GeneratedFileMetaSchema).toBeDefined()
      expect(CollisionPolicySchema).toBeDefined()
      expect(SyncOptionsSchema).toBeDefined()
      expect(SyncResultSchema).toBeDefined()
    })

    it("imports materialization type aliases", () => {
      const target: TargetConfig = { path: "/test", scope: "project" }
      expect(target.path).toBe("/test")
      expect(target.scope).toBe("project")

      const meta: GeneratedFileMeta = { hash: "abc123" }
      expect(meta.hash).toBe("abc123")

      const policy: CollisionPolicy = "overwrite"
      expect(policy).toBe("overwrite")

      const options: SyncOptions = { dryRun: true, backup: false }
      expect(options.dryRun).toBe(true)
      expect(options.backup).toBe(false)

      const result: SyncResult = { success: true, files: [] }
      expect(result.success).toBe(true)
    })

    it("imports sync module", () => {
      expect(syncFiles).toBeDefined()
      expect(typeof syncFiles).toBe("function")
    })

    it("imports renderer module", () => {
      expect(renderAgentDefinition).toBeDefined()
      expect(typeof renderAgentDefinition).toBe("function")
    })

    it("imports opencode-adapter module", () => {
      expect(generateOpenCodeDescriptors).toBeDefined()
      expect(typeof generateOpenCodeDescriptors).toBe("function")
      expect(validateDescriptorCount).toBeDefined()
      expect(typeof validateDescriptorCount).toBe("function")
      expect(validateHarnessPrefix).toBeDefined()
      expect(typeof validateHarnessPrefix).toBe("function")
      expect(validateSafeIds).toBeDefined()
      expect(typeof validateSafeIds).toBe("function")
      expect(verifyDeterministic).toBeDefined()
      expect(typeof verifyDeterministic).toBe("function")
    })

    it("generates exactly 15 descriptors", () => {
      const descriptors = generateOpenCodeDescriptors()
      expect(descriptors.length).toBe(15)
    })

    it("validates TargetConfig schema", () => {
      const valid = TargetConfigSchema.parse({ path: "/test", scope: "global" })
      expect(valid.path).toBe("/test")
      expect(valid.scope).toBe("global")
    })

    it("validates SyncOptions schema with defaults", () => {
      const parsed = SyncOptionsSchema.parse({})
      expect(parsed.dryRun).toBe(false)
      expect(parsed.backup).toBe(true)
      expect(parsed.overwritePolicy).toBe("backup")
      expect(parsed.verbose).toBe(false)
    })

    it("validates CollisionPolicy values", () => {
      const error = CollisionPolicySchema.parse("error")
      const skip = CollisionPolicySchema.parse("skip")
      const overwrite = CollisionPolicySchema.parse("overwrite")
      const backup = CollisionPolicySchema.parse("backup")

      expect(error).toBe("error")
      expect(skip).toBe("skip")
      expect(overwrite).toBe("overwrite")
      expect(backup).toBe("backup")
    })

    it("generates opencode agent descriptors", () => {
      const descriptors: OpenCodeAgentDescriptor[] = generateOpenCodeDescriptors()
      expect(descriptors).toBeDefined()
      expect(Array.isArray(descriptors)).toBe(true)

      // Validate descriptor count
      const countResult = validateDescriptorCount(descriptors)
      expect(countResult.valid).toBe(true)
      expect(countResult.actual).toBe(15)

      // Validate harness prefix
      const prefixResult = validateHarnessPrefix(descriptors)
      expect(prefixResult.valid).toBe(true)
      expect(prefixResult.invalidIds).toHaveLength(0)

      // Validate safe IDs
      const safeResult = validateSafeIds(descriptors)
      expect(safeResult.valid).toBe(true)

      // Verify deterministic generation
      expect(verifyDeterministic()).toBe(true)
    })
  })
})
