import { createEnhancedAgenticWorkflowPlugin } from "./enhanced-agentic-workflow.js"

export const EnhancedAgenticWorkflowPlugin = createEnhancedAgenticWorkflowPlugin({
  workflowTag: "my-team-agentic-flow",
  blockedCommandPatterns: ["rm -rf /", "shutdown"],
  injectEnv: {
    TEAM: "platform",
    WORKFLOW_MODE: "strict",
  },
  extraCompactionContext: [
    "Current branch and pending PR checks",
    "Cross-agent ownership of active files",
  ],
  onEvent: async (event) => {
    if (event.type === "session.error") {
      console.error("Session error detected", event.properties)
    }
  },
})
