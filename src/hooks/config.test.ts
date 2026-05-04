import { describe, expect, it } from "bun:test"
import type { Config } from "@opencode-ai/plugin"

import { createConfigHook } from "./config"

describe("createConfigHook", () => {
  it("disables default OpenCode agents and registers prompt-backed workflow agents", async () => {
    const config: Config = {}

    await createConfigHook()(config)

    expect(config.agent?.general?.disable).toBe(true)
    expect(config.agent?.plan?.disable).toBe(true)
    expect(config.agent?.build?.disable).toBe(true)
    expect(config.agent?.explore?.disable).toBe(true)

    expect(config.agent?.architect).toMatchObject({
      description: expect.stringContaining("Shapes user goals"),
      mode: "primary",
      prompt: expect.stringContaining("# Architect"),
    })
    expect(config.agent?.planner).toMatchObject({
      description: expect.stringContaining("approved designs"),
      mode: "primary",
      prompt: expect.stringContaining("# Planner"),
    })
    expect(config.agent?.executor).toMatchObject({
      description: expect.stringContaining("Executes existing plans"),
      mode: "primary",
      prompt: expect.stringContaining("# Executor"),
    })
  })

  it("preserves existing workflow agent config fields while refreshing generated fields", async () => {
    const config: Config = {
      agent: {
        architect: {
          color: "#123456",
          description: "stale",
          prompt: "stale",
        },
      },
    }

    await createConfigHook()(config)

    expect(config.agent?.architect).toMatchObject({
      color: "#123456",
      description: expect.stringContaining("Shapes user goals"),
      mode: "primary",
      prompt: expect.stringContaining("# Architect"),
    })
  })
})
