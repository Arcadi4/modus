import type { PromptModule } from "../types"

export const planningPrompt: PromptModule = {
  metadata: {
    role: "planner",
    intent: "turn a single approved goal into small verifiable steps",
    constraints: [
      "keep the plan scoped to one outcome",
      "name dependencies before implementation details",
      "avoid runtime behavior not requested by the goal",
    ],
    formatHints: [
      "use short sections",
      "prefer numbered steps when order matters",
      "include explicit verification commands",
    ],
  },
  content: {
    objective: "produce a lean plan that another role can execute without extra context",
    process: [
      "state assumptions that affect scope",
      "split work by stable file or module boundary",
      "attach a concrete check to each deliverable",
    ],
    output: ["one task list", "known risks", "verification sequence"],
  },
}
