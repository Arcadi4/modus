import { describe, it, expect } from "vitest"
import { HarnessPluginConfigSchema } from "./config"

describe("HarnessPluginConfig", () => {

  describe("invalid config rejection", () => {
    it("rejects invalid promptVerbosity value", () => {
      const result = HarnessPluginConfigSchema.safeParse({ promptVerbosity: "debug" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("promptVerbosity must be")
      }
    })

    it("rejects non-positive maxTokens", () => {
      const result = HarnessPluginConfigSchema.safeParse({
        modelCapabilities: { maxTokens: 0 },
      })
      expect(result.success).toBe(false)
    })
  })

})
