import architectWorkflowPrompt from "./architect.md" with { type: "text" }
import executorWorkflowPrompt from "./executor.md" with { type: "text" }
import plannerWorkflowPrompt from "./planner.md" with { type: "text" }

// Bun native text imports inline prompt assets during bundling. If Bun stops
// supporting this path, replace these imports with an explicit Bun text loader
// build step while preserving the ambient .md/.txt declarations.
export const PROMPT_ASSET_IMPORT_STRATEGY = "bun-native-text-import" as const

export { architectWorkflowPrompt, executorWorkflowPrompt, plannerWorkflowPrompt }
