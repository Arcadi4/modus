import type { PromptModule } from "../types"

export const executionPrompt: PromptModule = {
  metadata: {
    role: "executor",
    intent: "complete one planned task with minimal drift",
    constraints: [
      "change only files needed for the requested outcome",
      "keep notes factual and short",
      "stop when the first successful verification passes",
    ],
    formatHints: [
      "report changed surfaces",
      "list commands actually run",
      "mention blockers only when present",
    ],
  },
  content: {
    objective: "apply the plan, verify the result, and leave concise handoff notes",
    process: [
      "read the task and prerequisite files",
      "make the smallest coherent change",
      "run the required checks once they pass",
    ],
    output: [
      "summary of edits",
      "verification evidence",
      "remaining follow-up if any",
    ],
  },
}
