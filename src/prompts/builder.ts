import type { DirectiveOptions, PromptModule, PromptSection } from "./types"

function normalizeLine(line: string): string {
  return line.trim().replace(/\s+/g, " ")
}

function bulletLines(lines: readonly string[]): string[] {
  return lines.map((line) => `- ${normalizeLine(line)}`)
}

function renderSection(section: PromptSection): string {
  const marker = normalizeLine(section.marker).toUpperCase()
  return [`[${marker}]`, ...section.lines.map(normalizeLine)].join("\n")
}

export function buildPromptSections(module: PromptModule): PromptSection[] {
  return [
    {
      marker: "metadata",
      kind: "metadata",
      lines: [
        `Role: ${module.metadata.role}`,
        `Intent: ${module.metadata.intent}`,
      ],
    },
    {
      marker: "constraints",
      kind: "metadata",
      lines: bulletLines(module.metadata.constraints),
    },
    {
      marker: "format",
      kind: "metadata",
      lines: bulletLines(module.metadata.formatHints),
    },
    {
      marker: "content",
      kind: "content",
      lines: [
        `Objective: ${module.content.objective}`,
        "Process:",
        ...bulletLines(module.content.process),
        "Output:",
        ...bulletLines(module.content.output),
      ],
    },
  ]
}

export function buildPrompt(module: PromptModule): string {
  return buildPromptSections(module).map(renderSection).join("\n\n")
}

export function buildDirective(options: DirectiveOptions): string {
  return renderSection({
    marker: options.marker,
    kind: "directive",
    lines: [options.text],
  })
}

export function buildReminder(options: DirectiveOptions): string {
  return renderSection({
    marker: options.marker,
    kind: "reminder",
    lines: [options.text],
  })
}
