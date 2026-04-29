export {
  CapabilityRequirementSchema,
  CommandDescriptorSchema,
  CommandSurfaceSchema,
  ExtensionDescriptorSchema,
  ExtensionKindSchema,
  HookDescriptorSchema,
  HookSurfaceSchema,
  SafetyMetadataSchema,
  ToolDescriptorSchema,
  ToolSurfaceSchema,
} from "./schema"
export type {
  CapabilityRequirement,
  CommandDescriptor,
  CommandSurface,
  ExtensionDescriptor,
  ExtensionKind,
  HookDescriptor,
  HookSurface,
  SafetyMetadata,
  ToolDescriptor,
  ToolSurface,
} from "./schema"
export { createExtensionRegistry } from "./registry"
export type { ExtensionRegistry } from "./registry"
export {
  exampleCommandDescriptor,
  exampleExtensionDescriptors,
  exampleHookDescriptor,
  exampleToolDescriptor,
} from "./examples"
