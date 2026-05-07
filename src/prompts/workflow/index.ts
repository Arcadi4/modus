import architectPrompt from "../../../portable/prompts/agents/architect.md" with { type: "text" }
import executorPrompt from "../../../portable/prompts/agents/executor.md" with { type: "text" }
import plannerPrompt from "../../../portable/prompts/agents/planner.md" with { type: "text" }

export const PROMPT_ASSET_IMPORT_STRATEGY = "portable-bun-text-import" as const

export { architectPrompt as architectWorkflowPrompt, executorPrompt as executorWorkflowPrompt, plannerPrompt as plannerWorkflowPrompt }
