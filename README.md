# harness

All harnesses today are unmaintainable AI slop continuously patched by slop that dumps slop into your model context so they can produce more slop.

This one, is engineered, not hyped.

## OpenCode plugin scaffold: enhanced agentic workflow

This repository now includes a starter OpenCode plugin scaffold designed for enhanced agentic workflow use cases.

### Files

- `/home/runner/work/harness/harness/.opencode/opencode.json` - sample plugin registration in OpenCode config
- `/home/runner/work/harness/harness/.opencode/plugins/enhanced-agentic-workflow.js` - extensible plugin scaffold
- `/home/runner/work/harness/harness/.opencode/plugins/enhanced-agentic-workflow.example.js` - example customization

### What the scaffold includes

- Environment injection for shell execution (`shell.env`)
- Guardrails for risky bash commands (`tool.execute.before`)
- Session compaction context enrichment (`experimental.session.compacting`)
- Idle-session structured logging (`session.idle`)
- Extension points for custom event handling and policy logic

### Usage

1. Keep plugin files in OpenCode plugin directory (`.opencode/plugins/`).
2. Ensure your `opencode.json` includes:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["./plugins/enhanced-agentic-workflow.js"]
}
```

3. Customize behavior by exporting your own plugin via `createEnhancedAgenticWorkflowPlugin(...)` as shown in `enhanced-agentic-workflow.example.js`.
