import { describe, it, expect } from "vitest"
import { HarnessPluginConfigSchema, loadConfig } from "../config"
import type { HarnessPluginConfig } from "../config"

describe("HarnessPluginConfig", () => {
  describe("default config parsing", () => {
    it("parses empty config with defaults", () => {
      const config = loadConfig()
      expect(config.envPrefix).toBe("HARNESS")
      expect(config.promptVerbosity).toBe("normal")
    })

    it("applies roleProfiles defaults when provided", () => {
      const config = HarnessPluginConfigSchema.parse({
        roleProfiles: { developer: {} },
      })
      expect(config.roleProfiles?.developer?.enabled).toBe(true)
    })
  })

  describe("valid config variations", () => {
    it("accepts minimal promptVerbosity", () => {
      const config = HarnessPluginConfigSchema.parse({
        promptVerbosity: "minimal",
      })
      expect(config.promptVerbosity).toBe("minimal")
    })

    it("accepts verbose promptVerbosity", () => {
      const config = HarnessPluginConfigSchema.parse({
        promptVerbosity: "verbose",
      })
      expect(config.promptVerbosity).toBe("verbose")
    })

    it("accepts extensionToggles", () => {
      const config = HarnessPluginConfigSchema.parse({
        extensionToggles: {
          customExtension: { enabled: true },
        },
      })
      expect(config.extensionToggles?.customExtension?.enabled).toBe(true)
    })

    it("accepts modelCapabilities", () => {
      const config = HarnessPluginConfigSchema.parse({
        modelCapabilities: {
          supportsStreaming: true,
          supportsTools: true,
          maxTokens: 128000,
        },
      })
      expect(config.modelCapabilities?.supportsStreaming).toBe(true)
      expect(config.modelCapabilities?.supportsTools).toBe(true)
      expect(config.modelCapabilities?.maxTokens).toBe(128000)
    })
  })

  describe("invalid config rejection", () => {
    it("rejects invalid promptVerbosity", () => {
      expect(() => HarnessPluginConfigSchema.parse({ promptVerbosity: "invalid" })).toThrow()
    })

    it("rejects invalid promptVerbosity value", () => {
      const result = HarnessPluginConfigSchema.safeParse({ promptVerbosity: "debug" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("promptVerbosity must be")
      }
    })

    it("rejects negative maxTokens", () => {
      const result = HarnessPluginConfigSchema.safeParse({
        modelCapabilities: { maxTokens: -1 },
      })
      expect(result.success).toBe(false)
    })

    it("rejects non-positive maxTokens", () => {
      const result = HarnessPluginConfigSchema.safeParse({
        modelCapabilities: { maxTokens: 0 },
      })
      expect(result.success).toBe(false)
    })
  })

  describe("type exports", () => {
    it("uses exported HarnessPluginConfig type", () => {
      const config: HarnessPluginConfig = {
        envPrefix: "TEST",
        promptVerbosity: "minimal",
      }
      expect(config.envPrefix).toBe("TEST")
      expect(config.promptVerbosity).toBe("minimal")
    })
  })
})
