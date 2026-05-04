import { describe, expect, it } from "vitest"

import {
  createExtensionRegistry,
  exampleCommandDescriptor,
  exampleHookDescriptor,
  exampleToolDescriptor,
  ExtensionDescriptorSchema,
} from "./index"

describe("extension descriptors", () => {
  it("validates command, tool, and hook examples", () => {
    expect(ExtensionDescriptorSchema.parse(exampleCommandDescriptor)).toEqual(
      exampleCommandDescriptor
    )
    expect(ExtensionDescriptorSchema.parse(exampleToolDescriptor)).toEqual(exampleToolDescriptor)
    expect(ExtensionDescriptorSchema.parse(exampleHookDescriptor)).toEqual(exampleHookDescriptor)
  })

  it("registers descriptors in memory by kind and id", () => {
    const registry = createExtensionRegistry()

    registry.register(exampleCommandDescriptor)
    registry.register(exampleToolDescriptor)
    registry.register(exampleHookDescriptor)

    expect(registry.commands.get(exampleCommandDescriptor.id)).toEqual(exampleCommandDescriptor)
    expect(registry.tools.get(exampleToolDescriptor.id)).toEqual(exampleToolDescriptor)
    expect(registry.hooks.get(exampleHookDescriptor.id)).toEqual(exampleHookDescriptor)
    expect(registry.list()).toEqual([
      exampleCommandDescriptor,
      exampleToolDescriptor,
      exampleHookDescriptor,
    ])
  })
})
