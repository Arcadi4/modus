import { describe, expect, it } from "bun:test"
import { RoleManifestSchema } from "./roles"
import {
  createExtensionRegistry,
  ExtensionDescriptorSchema,
  HookDescriptorSchema,
  type ExtensionDescriptor,
} from "./extensions"

describe("scaffold integrity", () => {
  describe("extension registry", () => {
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
          // missing displayName, category, description
        })
      ).toThrow()
    })

    it("rejects manifest with invalid role name", () => {
      const result = RoleManifestSchema.safeParse({
        id: "role:invalid",
        name: "invalid-role-name",
        displayName: "Invalid Role",
        category: "primary",
        description: "An invalid role",
        recommendedSkills: [],
        recommendedTools: [],
        guidance: "No delegation",
      })
      expect(result.success).toBe(false)
    })

    it("rejects manifest with invalid category", () => {
      const result = RoleManifestSchema.safeParse({
        id: "role:test",
        name: "architect",
        displayName: "Test",
        category: "invalid-category",
        description: "Test role",
        recommendedSkills: [],
        recommendedTools: [],
        guidance: "Test",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("invalid extension descriptor rejection", () => {
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
})
