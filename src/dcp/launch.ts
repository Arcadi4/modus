import type { ModusPluginConfig } from "../config"
import { ensureDCPBuild, type DCPBuildStatus } from "./build"
import { detectDCP, type DCPDetectionResult } from "./detector"
import { logDCPDecision } from "./diagnostics"
import { injectDCP, type DCPInjectionResult } from "./injector"

export type DCPPrepareResult =
  | {
      status: "detected"
      detection: DCPDetectionResult
      phase: "detect-only"
    }
  | {
      status: "injected"
      build: DCPBuildStatus & { status: "available" }
      injection: DCPInjectionResult
      phase: "build-inject"
    }
  | {
      status: "skipped"
      reason: string
      phase: "disabled"
    }
  | {
      status: "warning"
      reason: string
      phase: "build-failed" | "inject-failed"
    }

export type DCPPrepareOptions = {
  config: ModusPluginConfig
  configDir: string
  rootDir?: string
}

/**
 * Prepares DCP for launch by orchestrating detection, build verification, and injection.
 *
 * Flow:
 * 1. Check if DCP is enabled in config (dcp.enabled)
 * 2. Detect existing DCP in the environment
 * 3. If detected → return early (no action needed)
 * 4. If not detected → verify/build DCP submodule
 * 5. If build available → inject into harness-managed profile
 * 6. Log all decisions with [DCP] prefix
 * 7. On failure, warn+continue per failureBehavior config
 *
 * @param options - Configuration and paths for DCP preparation
 * @returns Structured result indicating what phase completed and status
 */
export async function prepareDCP(options: DCPPrepareOptions): Promise<DCPPrepareResult> {
  const { config, configDir, rootDir } = options

  // Step 1: Check if DCP is enabled
  if (!config.dcp.enabled) {
    const result: DCPPrepareResult = {
      status: "skipped",
      reason: "DCP is disabled in config (dcp.enabled: false)",
      phase: "disabled",
    }
    logDCPDecision({ detected: false, signals: [], reason: result.reason })
    return result
  }

  // Step 2: Detect existing DCP
  const detectionResult = detectDCP({
    cwd: rootDir,
    includePluginRegistry: true,
  })

  if (detectionResult.detected) {
    logDCPDecision(detectionResult)
    return {
      status: "detected",
      detection: detectionResult,
      phase: "detect-only",
    }
  }

  // Step 3: DCP not detected, verify/build submodule
  const buildResult = await ensureDCPBuild({
    rootDir,
    submodulePath: config.dcp.submodulePath,
    pinnedTag: config.dcp.pinnedTag,
  })

  logDCPDecision(buildResult)

  if (buildResult.status !== "available") {
    // Build unavailable - warn and continue per failureBehavior
    const failureMessage =
      config.dcp.failureBehavior === "warn-continue"
        ? `DCP build unavailable, continuing without DCP: ${buildResult.message}`
        : `DCP build unavailable: ${buildResult.message}`

    const result: DCPPrepareResult = {
      status: "warning",
      reason: failureMessage,
      phase: "build-failed",
    }

    // Log the warning
    console.warn(`[DCP] ${result.status}: ${result.reason}`)

    return result
  }

  // Step 4: Inject DCP into modus-managed profile
  const injectionResult = await injectDCP({
    configDir,
    rootDir,
    submodulePath: config.dcp.submodulePath,
  })

  logDCPDecision(injectionResult)

  if (injectionResult.status === "warning") {
    const failureMessage =
      config.dcp.failureBehavior === "warn-continue"
        ? `DCP injection failed, continuing without DCP: ${injectionResult.reason}`
        : `DCP injection failed: ${injectionResult.reason}`

    const result: DCPPrepareResult = {
      status: "warning",
      reason: failureMessage,
      phase: "inject-failed",
    }

    // Log the warning
    console.warn(`[DCP] ${result.status}: ${result.reason}`)

    return result
  }

  // Success: DCP injected
  return {
    status: "injected",
    build: buildResult as DCPBuildStatus & { status: "available" },
    injection: injectionResult,
    phase: "build-inject",
  }
}
