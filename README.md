<div align="center">

# Modus

*Modus Operandi* — a method of operating. An engineered agentic workflow for engineers.

[![OpenCode](https://img.shields.io/badge/OpenCode-black?style=flat-square&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIj48c3ZnIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIGZpbGw9IiMxMzEwMTAiPjwvcmVjdD4KPHBhdGggZD0iTTMyMCAyMjRWMzUySDE5MlYyMjRIMzIwWiIgZmlsbD0iIzVBNTg1OCI+PC9wYXRoPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTM4NCA0MTZIMTI4Vjk2SDM4NFY0MTZaTTMyMCAxNjBIMTkyVjM1MkgzMjBWMTYwWiIgZmlsbD0id2hpdGUiPjwvcGF0aD4KPC9zdmc+PHN0eWxlPkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGxpZ2h0KSB7IDpyb290IHsgZmlsdGVyOiBub25lOyB9IH0KQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykgeyA6cm9vdCB7IGZpbHRlcjogbm9uZTsgfSB9Cjwvc3R5bGU+PC9zdmc+)](https://github.com/anomalyco/opencode) [![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org) [![License](https://img.shields.io/badge/License-GPL%20v3.0-blue?style=flat-square)](LICENSE)

[Overview](#overview) • [Features](#features) • [The Crew](#the-crew) • [Installation](#installation) • [Usage](#usage)

</div>

---

## Overview

> The *modus operandi* of your agentic workflow.

Modus is a complete agentic framework built on [OpenCode](https://github.com/anomalyco/opencode). It treats context as currency — every token must earn its place.

Where most harnesses spend tokens freely on the assumption that more is better, Modus enforces structural discipline: heavy reasoning up front on the strongest models, lean execution at the codeface on the lightest model that can do the job. Architect, then plan, then build. In that order, every time.

> [!NOTE]
> Check out the [design philosophy](docs/PHILOSOPHY.md) for the principles behind.

## Features

- Context discipline. Conversation loops are identified, pruned, and archived. The agent's context window contains only what matters *right now*.
- Prepend heavy reasoning. Architecture and planning are done by the most capable models. Execution and sub-tasks run on the lighter ones.
- One-time plans. Every plan serves one execution cycle, then it's discarded. Plan-specific terminology never leaks into code, commits, or user-facing output.
- Skill shadowing. Sub-agents carry only the skills their task demands. A unit test writer doesn't see the architecture docs. A planner doesn't need a linter.
- ADR-centered documentation. Architecture Decision Records capture only authentic human decisions. No AI slop documentations that were never read, updated, or used properly.
- Codebase as the single source of truth. Documentations are for humans, not Transformers. The only point of documentation is to navigate the codebase rather than an intermediary interpreter. The best way of understanding the code is to read it right away.

## The Crew

Modus deploys a methodical chain of command — each role with a clear mandate, a bounded context window, and exactly the right model for its work.

| Role | Mandate | Suitable Models |
|------|---------|-----------------|
| Architect | Your product manager and technical lead. Analyzes intent, gathers references, formulates design. Strong long context capabilities, deep reasoning. | GPT-5.4/5, Claude Opus, DeepSeek V4 Pro |
| Planner | Translates design into an executable plan. Deep reasoning, minimal output. | GPT-5.x, Claude Sonnet, GLM 5/5.1 |
| Executor | Orchestrates planned steps by dispatching sub-agents. Does not write code directly unless trivial. | Claude Sonnet, GPT-5.x-codex |
| Agile | Handles what can't be planned: tricky debugging, CI/CD configuration, or just a minor feature came into your mind. One-shot, adjusts to your needs. | Claude Sonnet, GPT-5.x |
| Introspective | Extracts reusable skills and documentation from completed sessions. Actively rejects unrepresentative or unclear input to maintain quality. | — |
