import {
  ExtensionDescriptorSchema,
  type CommandDescriptor,
  type ExtensionDescriptor,
  type HookDescriptor,
  type ToolDescriptor,
} from "./schema"

export interface ExtensionRegistry {
  readonly commands: Map<string, CommandDescriptor>
  readonly tools: Map<string, ToolDescriptor>
  readonly hooks: Map<string, HookDescriptor>
  register(descriptor: ExtensionDescriptor): ExtensionDescriptor
  list(): ExtensionDescriptor[]
}

export function createExtensionRegistry(
  descriptors: readonly ExtensionDescriptor[] = []
): ExtensionRegistry {
  const commands = new Map<string, CommandDescriptor>()
  const tools = new Map<string, ToolDescriptor>()
  const hooks = new Map<string, HookDescriptor>()

  const registry: ExtensionRegistry = {
    commands,
    tools,
    hooks,
    register(descriptor) {
      const parsed = ExtensionDescriptorSchema.parse(descriptor)
      if (commands.has(parsed.id) || tools.has(parsed.id) || hooks.has(parsed.id)) {
        throw new Error(`Extension descriptor already registered: ${parsed.id}`)
      }

      if (parsed.kind === "command") commands.set(parsed.id, parsed)
      if (parsed.kind === "tool") tools.set(parsed.id, parsed)
      if (parsed.kind === "hook") hooks.set(parsed.id, parsed)

      return parsed
    },
    list() {
      return [...commands.values(), ...tools.values(), ...hooks.values()]
    },
  }

  for (const descriptor of descriptors) {
    registry.register(descriptor)
  }

  return registry
}
