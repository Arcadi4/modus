/**
 * FUTURE: Not implemented. Type definitions only.
 *
 * Optional extension points for context budgeting, loop notes,
 * and skill exposure profiles. See docs/scaffold/future-mechanisms.md
 */

/** FUTURE: Context budget for direct file reads by primary agents. */
export interface ContextBudget {
  /** Maximum files allowed in direct read budget. */
  maxFiles: number;
  /** Files already consumed from budget. */
  usedFiles: number;
  /** Rationale for each file selection. */
  selections: Array<{ path: string; reason: string }>;
}

/** FUTURE: Loop note for closed sub-discussion replacement. */
export interface LoopNote {
  /** Stable reference ID. */
  id: string;
  /** Source message range boundaries. */
  sourceBounds: { start: number; end: number };
  /** Initial request preserved. */
  initialRequest: string;
  /** Final conclusion preserved. */
  finalConclusion: string;
  /** Unresolved caveats if any. */
  caveats?: string[];
}

/** FUTURE: Skill exposure profile for agent/task scoping. */
export interface SkillExposureProfile {
  /** Agent role this profile applies to. */
  agentRole: string;
  /** Task type this profile applies to. */
  taskType: string;
  /** Skills exposed to this agent/task combination. */
  exposedSkills: string[];
  /** Whether user can override the profile. */
  allowOverride: boolean;
}

/** FUTURE: ADR record with human sign-off requirement. */
export interface ArchitectureDecisionRecord {
  /** Unique identifier (e.g., ADR-001). */
  id: string;
  /** Short descriptive title. */
  title: string;
  /** Current status. */
  status: "proposed" | "accepted" | "deprecated" | "superseded";
  /** Situation and constraints. */
  context: string;
  /** Specific decision made. */
  decision: string;
  /** Tradeoffs and implications. */
  consequences: string;
  /** Human approval required flag. */
  humanApprovalRequired: true;
  /** Approver name if approved. */
  approvedBy?: string;
  /** Approval date if approved. */
  approvedDate?: string;
  /** Superseded by ADR ID if applicable. */
  supersededBy?: string;
}

// No runtime exports. Types only.
