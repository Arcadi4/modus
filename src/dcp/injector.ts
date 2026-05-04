import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"

/**
 * Marker indicating the file is managed by modus.
 * Used for idempotency and tracking.
 */
const MANAGED_MARKER = "<!-- MANAGED BY MODUS: DCP Plugin -->"

/**
 * Default DCP submodule path relative to project root.
 */
const DEFAULT_DCP_SUBMODULE_PATH = "vendor/opencode-dynamic-context-pruning"

/**
 * Result type for DCP injection operation.
 */
export type DCPInjectionResult = {
  status: "injected" | "skipped" | "warning"
  reason?: string
  configPath?: string
  pluginPath?: string
}

/**
 * Options for DCP injection.
 */
export type DCPInjectorOptions = {
  /** The modus-managed config directory (e.g., {profileDir}/config/opencode) */
  configDir: string
  /** Optional override for DCP submodule path (relative to project root) */
  submodulePath?: string
  /** Optional project root directory (defaults to process.cwd()) */
  rootDir?: string
}

/**
 * Type for tui.json structure.
 */
type TuiConfig = {
  plugin?: string[]
  [key: string]: unknown
}

/**
 * Checks if a file exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Checks if DCP plugin reference already exists in the plugin array.
 * Performs idempotency check - returns true if DCP plugin is already present.
 */
function hasDCPPluginReference(plugins: string[], dcpPluginPath: string): boolean {
  // Check for exact path match
  if (plugins.includes(dcpPluginPath)) {
    return true
  }

  // Check for any reference containing the DCP submodule path
  const dcpIndicators = ["opencode-dynamic-context-pruning", "dynamic-context-pruning"]

  return plugins.some((plugin) => dcpIndicators.some((indicator) => plugin.includes(indicator)))
}

/**
 * Reads and parses tui.json config file.
 * Returns empty object if file doesn't exist or is invalid.
 */
async function readTuiConfig(configPath: string): Promise<TuiConfig> {
  try {
    const content = await readFile(configPath, "utf8")
    // Strip managed marker comment if present
    let stripped = content
    if (stripped.startsWith(MANAGED_MARKER)) {
      stripped = stripped.slice(MANAGED_MARKER.length)
    }
    // Strip any leading whitespace/newlines
    stripped = stripped.trim()
    return JSON.parse(stripped) as TuiConfig
  } catch {
    return {}
  }
}

/**
 * Injects DCP plugin reference into modus-managed OpenCode tui.json config.
 *
 * This function:
 * 1. Reads the tui.json from the modus-managed config directory
 * 2. Checks if DCP plugin reference already exists (idempotency)
 * 3. If not present, adds the plugin reference as an absolute path
 * 4. Writes the updated config with a managed marker comment
 * 5. Returns status indicating injection, skip, or warning
 *
 * IMPORTANT: This ONLY modifies the modus-managed isolated profile config,
 * never the global OpenCode config (~/.config/opencode) or user project config.
 *
 * @param options - Injection options including configDir
 * @returns Result object with status and details
 */
export async function injectDCP(options: DCPInjectorOptions): Promise<DCPInjectionResult> {
  const { configDir } = options
  const rootDir = options.rootDir ?? process.cwd()
  const submodulePath = options.submodulePath ?? DEFAULT_DCP_SUBMODULE_PATH

  // Validate configDir is provided
  if (!configDir) {
    return {
      status: "warning",
      reason: "configDir is required but was not provided",
    }
  }

  // Resolve absolute paths
  const absoluteConfigDir = resolve(configDir)
  const tuiConfigPath = join(absoluteConfigDir, "tui.json")

  // Calculate DCP plugin entry point path (absolute)
  const absoluteRootDir = resolve(rootDir)
  const dcpPluginPath = resolve(absoluteRootDir, submodulePath, "dist", "index.js")

  // Ensure config directory exists
  try {
    await mkdir(absoluteConfigDir, { recursive: true })
  } catch (error) {
    return {
      status: "warning",
      reason: `Failed to create config directory: ${error}`,
      configPath: tuiConfigPath,
    }
  }

  // Read existing tui.json or start with empty config
  const config = await readTuiConfig(tuiConfigPath)

  // Ensure plugin array exists
  const plugins = Array.isArray(config.plugin) ? config.plugin : []

  // Idempotency check: skip if DCP plugin already present
  if (hasDCPPluginReference(plugins, dcpPluginPath)) {
    return {
      status: "skipped",
      reason: "DCP plugin reference already exists in tui.json",
      configPath: tuiConfigPath,
      pluginPath: dcpPluginPath,
    }
  }

  // Add DCP plugin reference
  const updatedPlugins = [...plugins, dcpPluginPath]
  const updatedConfig: TuiConfig = {
    ...config,
    plugin: updatedPlugins,
  }

  // Write updated config with managed marker comment
  const jsonContent = JSON.stringify(updatedConfig, null, 2)
  const contentWithMarker = `${MANAGED_MARKER}\n${jsonContent}\n`

  try {
    await writeFile(tuiConfigPath, contentWithMarker, "utf8")
  } catch (error) {
    return {
      status: "warning",
      reason: `Failed to write tui.json: ${error}`,
      configPath: tuiConfigPath,
    }
  }

  return {
    status: "injected",
    reason: `DCP plugin reference added to tui.json (${updatedPlugins.length} total plugins)`,
    configPath: tuiConfigPath,
    pluginPath: dcpPluginPath,
  }
}

/**
 * Removes DCP plugin reference from modus-managed tui.json config.
 *
 * Used for cleanup/uninstall operations. Idempotent - safe to call
 * even if DCP is not present.
 *
 * @param options - Injection options including configDir
 * @returns Result object with status and details
 */
export async function removeDCP(options: DCPInjectorOptions): Promise<DCPInjectionResult> {
  const { configDir } = options
  const rootDir = options.rootDir ?? process.cwd()
  const submodulePath = options.submodulePath ?? DEFAULT_DCP_SUBMODULE_PATH

  if (!configDir) {
    return {
      status: "warning",
      reason: "configDir is required but was not provided",
    }
  }

  const absoluteConfigDir = resolve(configDir)
  const tuiConfigPath = join(absoluteConfigDir, "tui.json")

  // Calculate DCP plugin path for matching
  const absoluteRootDir = resolve(rootDir)
  const dcpPluginPath = resolve(absoluteRootDir, submodulePath, "dist", "index.js")

  // Check if file exists
  if (!(await fileExists(tuiConfigPath))) {
    return {
      status: "skipped",
      reason: "tui.json does not exist",
      configPath: tuiConfigPath,
    }
  }

  // Read existing config
  const config = await readTuiConfig(tuiConfigPath)
  const plugins = Array.isArray(config.plugin) ? config.plugin : []

  // Check if DCP plugin is present
  if (!hasDCPPluginReference(plugins, dcpPluginPath)) {
    return {
      status: "skipped",
      reason: "DCP plugin reference not found in tui.json",
      configPath: tuiConfigPath,
    }
  }

  // Remove DCP plugin reference
  const dcpIndicators = [
    dcpPluginPath,
    "opencode-dynamic-context-pruning",
    "dynamic-context-pruning",
  ]

  const updatedPlugins = plugins.filter(
    (plugin) => !dcpIndicators.some((indicator) => plugin.includes(indicator))
  )

  const updatedConfig: TuiConfig = {
    ...config,
    plugin: updatedPlugins,
  }

  // Write updated config
  const jsonContent = JSON.stringify(updatedConfig, null, 2)
  const contentWithMarker = `${MANAGED_MARKER}\n${jsonContent}\n`

  try {
    await writeFile(tuiConfigPath, contentWithMarker, "utf8")
  } catch (error) {
    return {
      status: "warning",
      reason: `Failed to write tui.json: ${error}`,
      configPath: tuiConfigPath,
    }
  }

  return {
    status: "injected",
    reason: `DCP plugin reference removed from tui.json (${updatedPlugins.length} remaining plugins)`,
    configPath: tuiConfigPath,
    pluginPath: dcpPluginPath,
  }
}
