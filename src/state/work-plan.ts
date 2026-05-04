import type { EvidenceId, SessionId, TaskId } from "../types/ids"
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { createHash, randomUUID } from "node:crypto"

export const WORK_PLAN_STATE_VERSION = 1
export const WORK_PLAN_STATE_NAMESPACE = "modus.work-plan"

export interface WorkPlanStateMetadata {
  readonly version: typeof WORK_PLAN_STATE_VERSION
  readonly namespace: typeof WORK_PLAN_STATE_NAMESPACE
  readonly maxPollingIntervalMs: number
  readonly staleDetectionThresholdMs: number
  readonly userVisibleNotices: {
    readonly stalled: string
    readonly cancelled: string
  }
}

export const WORK_PLAN_STATE_METADATA: WorkPlanStateMetadata = {
  version: WORK_PLAN_STATE_VERSION,
  namespace: WORK_PLAN_STATE_NAMESPACE,
  maxPollingIntervalMs: 30_000,
  staleDetectionThresholdMs: 300_000,
  userVisibleNotices: {
    stalled: "Work appears stalled; verify the active task before continuing.",
    cancelled: "Work was cancelled and will not continue automatically.",
  },
}

interface TaskProgressBase {
  readonly taskId: TaskId
  readonly title: string
  readonly evidenceIds?: readonly EvidenceId[]
  readonly userVisibleNotice?: string
}

export type TaskProgress =
  | (TaskProgressBase & {
      readonly status: "pending"
    })
  | (TaskProgressBase & {
      readonly status: "in_progress"
      readonly startedAt: string
    })
  | (TaskProgressBase & {
      readonly status: "completed"
      readonly startedAt: string
      readonly completedAt: string
    })
  | (TaskProgressBase & {
      readonly status: "cancelled"
      readonly cancelledAt: string
      readonly cancellationReason: string
    })

export interface WorkPlan {
  readonly version: typeof WORK_PLAN_STATE_VERSION
  readonly namespace: typeof WORK_PLAN_STATE_NAMESPACE
  readonly planId: TaskId
  readonly title: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly tasks: readonly TaskProgress[]
  readonly description?: string
  readonly evidenceIds?: readonly EvidenceId[]
}

export interface ActiveWorkState {
  readonly version: typeof WORK_PLAN_STATE_VERSION
  readonly namespace: typeof WORK_PLAN_STATE_NAMESPACE
  readonly activePlan: WorkPlan
  readonly sessionId: SessionId
  readonly currentTaskId?: TaskId
  readonly notices: readonly string[]
  readonly lastObservedAt?: string
  readonly staleAfter?: string
}

export function serializeActiveWorkState(state: ActiveWorkState): string {
  return JSON.stringify(state)
}

export const PLAN_SCHEMA_VERSION = 1
export const PLAN_MAX_BYTES = 512 * 1024
export const PLAN_MAX_TASKS = 200
export const PLAN_MAX_WAVES = 50

export type CheckboxStatus = "pending" | "completed"

export interface PlanMetadata {
  readonly planId: string
  readonly title: string
  readonly createdAt: string
  readonly draftSource: string
}

export interface PlanCheckboxTask {
  readonly taskId: string
  readonly title: string
  readonly status: CheckboxStatus
  readonly evidenceRefs: readonly string[]
}

export interface PlanTaskSection {
  readonly taskId: string
  readonly title: string
  readonly mustDo: readonly PlanCheckboxTask[]
  readonly mustNotDo: readonly string[]
  readonly references: readonly string[]
  readonly evidenceRequired: boolean
  readonly evidenceInstruction?: string
  readonly evidenceRefs: readonly string[]
  readonly commitRequired: boolean
  readonly commitMessage?: string
}

export interface ParsedWave {
  readonly waveId: number
  readonly description: string
  readonly dependencies: readonly string[]
  readonly tasks: readonly PlanTaskSection[]
}

export interface ParsedQAScenario {
  readonly scenario: string
  readonly steps: readonly string[]
  readonly expectedOutcome: string
}

export interface ParsedPlan {
  readonly schemaVersion: typeof PLAN_SCHEMA_VERSION
  readonly metadata: PlanMetadata
  readonly waves: readonly ParsedWave[]
  readonly acceptanceCriteria: readonly PlanCheckboxTask[]
  readonly qaScenarios: readonly ParsedQAScenario[]
  readonly evidencePaths: readonly string[]
}

export class PlanParseError extends Error {
  constructor(
    message: string,
    readonly line?: number,
  ) {
    super(line === undefined ? message : `Line ${line}: ${message}`)
    this.name = "PlanParseError"
  }
}

export class PlanUpdateConflictError extends Error {
  constructor(message = "Plan changed while update was in progress; reload and retry.") {
    super(message)
    this.name = "PlanUpdateConflictError"
  }
}

interface LineRecord {
  readonly number: number
  readonly text: string
}

interface SectionRange {
  readonly heading: LineRecord
  readonly body: readonly LineRecord[]
}

interface UpdateOptions {
  readonly evidenceRefs?: readonly string[]
  readonly now?: Date
}

export async function parsePlanFile(filePath: string): Promise<ParsedPlan> {
  const stats = await stat(filePath)
  if (stats.size > PLAN_MAX_BYTES) {
    throw new PlanParseError(
      `Plan exceeds MVP limit of ${PLAN_MAX_BYTES} bytes; split it into smaller plans.`,
    )
  }

  return parsePlanMarkdown(await readFile(filePath, "utf8"))
}

export function parsePlanMarkdown(markdown: string): ParsedPlan {
  const bytes = Buffer.byteLength(markdown, "utf8")
  if (bytes > PLAN_MAX_BYTES) {
    throw new PlanParseError(
      `Plan exceeds MVP limit of ${PLAN_MAX_BYTES} bytes; split it into smaller plans.`,
    )
  }

  const lines = toLineRecords(markdown)
  const schemaLine = requireLine(lines, /^\*\*schemaVersion\*\*: (\d+)$/, "Missing `**schemaVersion**: 1`.")
  const version = Number(schemaLine.text.match(/(\d+)$/)?.[1])
  if (version !== PLAN_SCHEMA_VERSION) {
    throw new PlanParseError(`Unsupported schemaVersion ${version}; expected ${PLAN_SCHEMA_VERSION}.`, schemaLine.number)
  }

  const metadataSection = sectionBody(lines, "## Metadata")
  const metadata = parseMetadata(metadataSection)
  const waves = parseWaves(lines)
  const acceptanceCriteria = parseAcceptanceCriteria(sectionBody(lines, "## Acceptance Criteria"))
  const qaScenarios = parseQAScenarios(sectionBody(lines, "## QA Scenarios"))
  const taskCount = waves.reduce((sum, wave) => sum + wave.tasks.length, 0)

  if (waves.length === 0) {
    throw new PlanParseError("Plan must contain at least one `## Wave {N}: {description}` section.")
  }
  if (waves.length > PLAN_MAX_WAVES) {
    throw new PlanParseError(`Plan has ${waves.length} waves; MVP limit is ${PLAN_MAX_WAVES}.`)
  }
  if (taskCount > PLAN_MAX_TASKS) {
    throw new PlanParseError(`Plan has ${taskCount} tasks; MVP limit is ${PLAN_MAX_TASKS}.`)
  }

  return {
    schemaVersion: PLAN_SCHEMA_VERSION,
    metadata,
    waves,
    acceptanceCriteria,
    qaScenarios,
    evidencePaths: collectEvidencePaths(waves),
  }
}

export async function markPlanTaskComplete(
  filePath: string,
  taskId: string,
  options: UpdateOptions = {},
): Promise<ParsedPlan> {
  return withPlanLock(filePath, async () => {
    const before = await readLimitedPlan(filePath)
    parsePlanMarkdown(before.content)
    const nextContent = updateTaskMarkdown(before.content, taskId, options)
    const nextPlan = parsePlanMarkdown(nextContent)
    await atomicCompareAndSwap(filePath, before.hash, nextContent)
    return nextPlan
  })
}

function toLineRecords(markdown: string): LineRecord[] {
  return markdown.split(/\r?\n/).map((text, index) => ({ number: index + 1, text }))
}

function requireLine(lines: readonly LineRecord[], pattern: RegExp, error: string): LineRecord {
  const line = lines.find((candidate) => pattern.test(candidate.text))
  if (!line) {
    throw new PlanParseError(error)
  }
  return line
}

function sectionBody(lines: readonly LineRecord[], heading: string): readonly LineRecord[] {
  const start = lines.findIndex((line) => line.text === heading)
  if (start === -1) {
    throw new PlanParseError(`Missing required section marker \`${heading}\`.`)
  }
  const end = findNextHeading(lines, start + 1, 2)
  return lines.slice(start + 1, end)
}

function findNextHeading(lines: readonly LineRecord[], start: number, level: number): number {
  const marker = `${"#".repeat(level)} `
  const index = lines.findIndex((line, offset) => offset >= start && line.text.startsWith(marker))
  return index === -1 ? lines.length : index
}

function parseMetadata(lines: readonly LineRecord[]): PlanMetadata {
  return {
    planId: requireMetadata(lines, "planId"),
    title: requireMetadata(lines, "title"),
    createdAt: requireMetadata(lines, "createdAt"),
    draftSource: stripBackticks(requireMetadata(lines, "draftSource")),
  }
}

function requireMetadata(lines: readonly LineRecord[], key: keyof PlanMetadata): string {
  const pattern = new RegExp(`^- \\*\\*${key}\\*\\*: (.+)$`)
  const line = requireLine(lines, pattern, `Missing metadata field \`${key}\` in \`## Metadata\`.`)
  const value = line.text.match(pattern)?.[1]?.trim()
  if (!value) {
    throw new PlanParseError(`Metadata field \`${key}\` must not be empty.`, line.number)
  }
  return value
}

function parseWaves(lines: readonly LineRecord[]): ParsedWave[] {
  const waves: ParsedWave[] = []
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index]?.text.match(/^## Wave (\d+): (.+)$/)
    if (!match) {
      continue
    }

    const end = findNextHeading(lines, index + 1, 2)
    const body = lines.slice(index + 1, end)
    const dependenciesLine = requireLine(
      body,
      /^\*\*Dependencies\*\*: .+$/,
      `Missing \`**Dependencies**:\` line for ${lines[index]?.text}.`,
    )
    const dependencies = parseDependencies(dependenciesLine.text)

    waves.push({
      waveId: Number(match[1]),
      description: match[2]?.trim() ?? "",
      dependencies,
      tasks: parseTaskSections(body),
    })
  }

  return waves
}

function parseDependencies(text: string): readonly string[] {
  const raw = text.replace(/^\*\*Dependencies\*\*: /, "").trim()
  return raw === "none" ? [] : raw.split(",").map((dependency) => dependency.trim())
}

function parseTaskSections(lines: readonly LineRecord[]): readonly PlanTaskSection[] {
  const tasks: PlanTaskSection[] = []
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index]?.text.match(/^### Task ([^:]+): (.+)$/)
    if (!match) {
      continue
    }

    const end = findNextHeading(lines, index + 1, 3)
    tasks.push(parseTaskSection(match[1] ?? "", match[2] ?? "", lines.slice(index + 1, end), lines[index]?.number))
  }
  return tasks
}

function parseTaskSection(
  taskId: string,
  title: string,
  lines: readonly LineRecord[],
  headingLine?: number,
): PlanTaskSection {
  const sections = splitTaskSubsections(lines)
  const whatToDo = requireSubsection(sections, "#### What to do", taskId)
  const mustNotDo = requireSubsection(sections, "#### Must NOT do", taskId)
  const references = requireSubsection(sections, "#### References", taskId)
  const evidence = requireSubsection(sections, "#### Evidence", taskId)
  const commit = requireSubsection(sections, "#### Commit", taskId)
  const checkboxes = parseCheckboxes(whatToDo, taskId)

  if (checkboxes.length === 0) {
    throw new PlanParseError(`Task ${taskId} must include at least one checkbox item in \`#### What to do\`.`, headingLine)
  }

  return {
    taskId,
    title: title.trim(),
    mustDo: checkboxes,
    mustNotDo: parseBullets(mustNotDo),
    references: parseBullets(references).map(stripBackticks),
    ...parseEvidence(evidence),
    ...parseCommit(commit),
  }
}

function splitTaskSubsections(lines: readonly LineRecord[]): Map<string, SectionRange> {
  const sections = new Map<string, SectionRange>()
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index]
    if (!heading?.text.startsWith("#### ")) {
      continue
    }
    const end = findNextHeading(lines, index + 1, 4)
    sections.set(heading.text, { heading, body: lines.slice(index + 1, end) })
  }
  return sections
}

function requireSubsection(
  sections: ReadonlyMap<string, SectionRange>,
  heading: string,
  taskId: string,
): readonly LineRecord[] {
  const section = sections.get(heading)
  if (!section) {
    throw new PlanParseError(`Task ${taskId} is missing required subsection \`${heading}\`.`)
  }
  return section.body
}

function parseCheckboxes(lines: readonly LineRecord[], parentTaskId: string): readonly PlanCheckboxTask[] {
  const tasks = lines.filter((line) => line.text.trim().length > 0).map((line) => {
    const match = line.text.match(/^- \[([ xX])\] ([^\s]+) (.+)$/)
    if (!match) {
      throw new PlanParseError(
        `Expected checkbox item \`- [ ] ${parentTaskId}.N Description\` or completed variant.`,
        line.number,
      )
    }

    const evidenceRefs = extractEvidenceSuffixRefs(match[3] ?? "")
    return {
      taskId: match[2] ?? "",
      title: stripEvidenceSuffix(match[3] ?? "").trim(),
      status: match[1] === " " ? "pending" as const : "completed" as const,
      evidenceRefs,
    }
  })

  const ids = new Set<string>()
  for (const task of tasks) {
    if (ids.has(task.taskId)) {
      throw new PlanParseError(`Duplicate checkbox task id \`${task.taskId}\` in task ${parentTaskId}.`)
    }
    ids.add(task.taskId)
  }
  return tasks
}

function parseBullets(lines: readonly LineRecord[]): readonly string[] {
  return lines.filter((line) => line.text.trim().length > 0).map((line) => {
    const match = line.text.match(/^- (.+)$/)
    if (!match) {
      throw new PlanParseError("Expected markdown bullet item starting with `- `.", line.number)
    }
    return match[1]?.trim() ?? ""
  })
}

function parseEvidence(lines: readonly LineRecord[]): Pick<PlanTaskSection, "evidenceRequired" | "evidenceInstruction" | "evidenceRefs"> {
  const content = nonEmptyText(lines)
  const evidenceRefs = extractEvidenceRefs(content)
  if (content.startsWith("YES")) {
    return { evidenceRequired: true, evidenceInstruction: content, evidenceRefs }
  }
  if (content === "NO") {
    return { evidenceRequired: false, evidenceRefs }
  }
  throw new PlanParseError("Evidence section must be `YES - ...` or `NO`.", lines[0]?.number)
}

function parseCommit(lines: readonly LineRecord[]): Pick<PlanTaskSection, "commitRequired" | "commitMessage"> {
  const content = nonEmptyText(lines)
  if (content.startsWith("YES - Message: `") && content.endsWith("`")) {
    return { commitRequired: true, commitMessage: content.slice("YES - Message: `".length, -1) }
  }
  if (content === "NO") {
    return { commitRequired: false }
  }
  throw new PlanParseError("Commit section must be `YES - Message: `...`` or `NO`.", lines[0]?.number)
}

function nonEmptyText(lines: readonly LineRecord[]): string {
  const text = lines.map((line) => line.text.trim()).filter(Boolean).join("\n")
  if (!text) {
    throw new PlanParseError("Required section must not be empty.", lines[0]?.number)
  }
  return text
}

function parseAcceptanceCriteria(lines: readonly LineRecord[]): readonly PlanCheckboxTask[] {
  return lines.filter((line) => line.text.trim().length > 0).map((line, index) => {
    const match = line.text.match(/^- \[([ xX])\] (.+)$/)
    if (!match) {
      throw new PlanParseError("Expected acceptance criterion checkbox starting with `- [ ]` or `- [x]`.", line.number)
    }

    const title = match[2] ?? ""
    return {
      taskId: `AC-${index + 1}`,
      title: stripEvidenceSuffix(title).trim(),
      status: match[1] === " " ? "pending" as const : "completed" as const,
      evidenceRefs: extractEvidenceRefs(title),
    }
  })
}

function parseQAScenarios(lines: readonly LineRecord[]): readonly ParsedQAScenario[] {
  const scenarios: ParsedQAScenario[] = []
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index]?.text.match(/^### Scenario \d+: (.+)$/)
    if (!match) {
      continue
    }

    const end = findNextHeading(lines, index + 1, 3)
    const body = lines.slice(index + 1, end)
    const stepsLine = requireLine(body, /^\*\*Steps\*\*:$/, `Scenario ${match[1]} is missing \`**Steps**:\`.`)
    const expectedLine = requireLine(body, /^\*\*Expected\*\*: .+$/, `Scenario ${match[1]} is missing \`**Expected**:\`.`)
    const steps = body
      .filter((line) => line.number > stepsLine.number && line.number < expectedLine.number && /^\d+\. .+$/.test(line.text))
      .map((line) => line.text.replace(/^\d+\. /, "").trim())

    scenarios.push({
      scenario: match[1]?.trim() ?? "",
      steps,
      expectedOutcome: expectedLine.text.replace(/^\*\*Expected\*\*: /, "").trim(),
    })
  }
  return scenarios
}

function collectEvidencePaths(waves: readonly ParsedWave[]): readonly string[] {
  return waves.flatMap((wave) => wave.tasks.flatMap((task) => task.evidenceRefs))
}

function stripBackticks(value: string): string {
  return value.replace(/^`|`$/g, "")
}

function extractEvidenceRefs(text: string): readonly string[] {
  return [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1] ?? "")
}

function extractEvidenceSuffixRefs(text: string): readonly string[] {
  const evidence = text.match(/— Evidence: (.+)$/)?.[1]
  return evidence ? extractEvidenceRefs(evidence) : []
}

function stripEvidenceSuffix(text: string): string {
  return text.replace(/\s+— Evidence: `[^`]+`/g, "")
}

async function readLimitedPlan(filePath: string): Promise<{ readonly content: string; readonly hash: string }> {
  const stats = await stat(filePath)
  if (stats.size > PLAN_MAX_BYTES) {
    throw new PlanParseError(
      `Plan exceeds MVP limit of ${PLAN_MAX_BYTES} bytes; split it into smaller plans.`,
    )
  }
  const content = await readFile(filePath, "utf8")
  return { content, hash: hashContent(content) }
}

function updateTaskMarkdown(markdown: string, taskId: string, options: UpdateOptions): string {
  const lines = markdown.split(/\r?\n/)
  const evidenceRefs = options.evidenceRefs ?? []
  const checkboxPattern = new RegExp(`^- \\[ \\] ${escapeRegExp(taskId)}(?=\\s|$)`)
  const completedPattern = new RegExp(`^- \\[x\\] ${escapeRegExp(taskId)}(?=\\s|$)`, "i")
  const index = lines.findIndex((line) => checkboxPattern.test(line) || completedPattern.test(line))
  if (index === -1) {
    throw new PlanParseError(`No checkbox task with id \`${taskId}\` found.`)
  }

  const line = lines[index]
  if (line === undefined) {
    throw new PlanParseError(`No checkbox task with id \`${taskId}\` found.`)
  }
  const suffix = evidenceRefs.length > 0 ? ` — Evidence: ${evidenceRefs.map((ref) => `\`${ref}\``).join(", ")}` : ""
  const withoutPreviousEvidence = stripEvidenceSuffix(line.replace(/^- \[[ xX]\]/, "- [x]"))
  lines[index] = `${withoutPreviousEvidence}${suffix}`

  if (evidenceRefs.length > 0) {
    insertTaskEvidenceRefs(lines, index, evidenceRefs, options.now ?? new Date())
  }

  return lines.join("\n")
}

function insertTaskEvidenceRefs(lines: string[], checkboxIndex: number, evidenceRefs: readonly string[], now: Date): void {
  const taskStart = findHeadingBefore(lines, checkboxIndex, "### Task ")
  if (taskStart === -1) {
    return
  }
  const taskEnd = findHeadingAfter(lines, taskStart + 1, "### ")
  const evidenceHeading = findInRange(lines, taskStart + 1, taskEnd, "#### Evidence")
  if (evidenceHeading === -1) {
    return
  }
  const insertAt = findHeadingAfter(lines, evidenceHeading + 1, "#### ")
  const stampedRefs = evidenceRefs.map((ref) => `- Completed ${now.toISOString()}: \`${ref}\``)
  const existing = new Set(lines.slice(evidenceHeading + 1, insertAt))
  const additions = stampedRefs.filter((line) => !existing.has(line))
  if (additions.length > 0) {
    lines.splice(insertAt, 0, ...additions)
  }
}

function findHeadingBefore(lines: readonly string[], start: number, prefix: string): number {
  for (let index = start; index >= 0; index -= 1) {
    if (lines[index]?.startsWith(prefix)) {
      return index
    }
  }
  return -1
}

function findHeadingAfter(lines: readonly string[], start: number, prefix: string): number {
  for (let index = start; index < lines.length; index += 1) {
    if (lines[index]?.startsWith(prefix)) {
      return index
    }
  }
  return lines.length
}

function findInRange(lines: readonly string[], start: number, end: number, target: string): number {
  for (let index = start; index < end; index += 1) {
    if (lines[index] === target) {
      return index
    }
  }
  return -1
}

async function atomicCompareAndSwap(filePath: string, expectedHash: string, content: string): Promise<void> {
  const current = await readLimitedPlan(filePath)
  if (current.hash !== expectedHash) {
    throw new PlanUpdateConflictError()
  }

  const directory = dirname(filePath)
  await mkdir(directory, { recursive: true })
  const temporaryPath = join(directory, `.${process.pid}.${randomUUID()}.tmp`)
  await writeFile(temporaryPath, content, { encoding: "utf8", flag: "wx" })
  try {
    const latest = await readLimitedPlan(filePath)
    if (latest.hash !== expectedHash) {
      throw new PlanUpdateConflictError()
    }
    await rename(temporaryPath, filePath)
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined)
    throw error
  }
}

async function withPlanLock<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
  const lockPath = `${filePath}.lock`
  const token = `${process.pid}:${randomUUID()}`
  try {
    await writeFile(lockPath, token, { encoding: "utf8", flag: "wx" })
  } catch {
    throw new PlanUpdateConflictError("Plan update already in progress; reload and retry.")
  }

  try {
    return await operation()
  } finally {
    await unlink(lockPath).catch(() => undefined)
  }
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex")
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
