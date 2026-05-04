import { describe, it, expect } from "bun:test"
import { ModusPluginConfigSchema } from "./config"

describe("ModusPluginConfig", () => {
  describe("invalid config rejection", () => {
    it("rejects invalid promptVerbosity value", () => {
      const result = ModusPluginConfigSchema.safeParse({ promptVerbosity: "debug" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("promptVerbosity must be")
      }
    })

    it("rejects non-positive maxTokens", () => {
      const result = ModusPluginConfigSchema.safeParse({
        modelCapabilities: { maxTokens: 0 },
      })
      expect(result.success).toBe(false)
    })
  })
})
