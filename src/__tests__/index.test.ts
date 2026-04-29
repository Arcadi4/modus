import { describe, it, expect } from "vitest"
import * as harness from "../index"

describe("HarnessPlugin exports", () => {
  it("exports HarnessPlugin as named export", () => {
    expect(harness).toHaveProperty("HarnessPlugin")
    expect(typeof harness.HarnessPlugin).toBe("function")
  })

  it("exports default HarnessPlugin", () => {
    expect(harness).toHaveProperty("default")
    expect(typeof harness.default).toBe("function")
  })
})