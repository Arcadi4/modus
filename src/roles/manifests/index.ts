export * from "./primary"
export * from "./subagents"

import { primaryRoleManifests } from "./primary"
import { subagentRoleManifests } from "./subagents"

export const allRoleManifests = [...primaryRoleManifests, ...subagentRoleManifests] as const
