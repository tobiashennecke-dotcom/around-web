# AROUND — ChatGPT + Claude Code Workflow

## Roles

### Tobias — Product Owner
Decides:
- priority
- product direction
- visual acceptance
- editorial quality
- what ships

### ChatGPT — Product / UX / Architecture / QA
Primary responsibilities:
- product reasoning
- UX critique from screenshots
- feature definition
- architecture constraints
- content system
- QA planning
- development specifications
- review of implementation outcomes

### Claude Code — Implementation Engineer
Primary responsibilities:
- inspect repository
- implement approved specification
- refactor only where required
- run typecheck/build/tests
- surface technical risks
- prepare clean code changes

### GitHub — Source of Truth
The repository contains:
- current code
- architecture docs
- product principles
- decisions
- active specs

Neither AI chat history is canonical development state.

## Recommended cycle

```text
Tobias + ChatGPT
      │
      ▼
Product / UX specification
      │
      ▼
Commit specification to GitHub
      │
      ▼
Claude Code reads CLAUDE.md + active spec
      │
      ▼
Feature branch implementation
      │
      ▼
Typecheck / Build / Tests
      │
      ▼
Tobias reviews deployed UI
      │
      ▼
ChatGPT reviews screenshots / behavior
      │
      ├─ accepted → merge / continue
      └─ repair needed → precise repair spec → Claude
```

## First Claude Code task

After this handoff is committed:

```text
Read CLAUDE.md, docs/state/CURRENT_STATE.md and docs/specs/v1.21-product-polish.md.
Inspect the current implementation before changing anything.
Implement v1.21 on a feature branch.
Do not change Supabase or Sanity schemas unless the specification explicitly requires it.
Run TypeScript checks and npm run build.
Then summarize changed files, implementation decisions, risks and anything you could not verify.
```

## Rules for parallel work

Do not have ChatGPT-generated patches and Claude Code modifying the same files at the same time.

Preferred approach:
- one implementation owner per version
- the other AI reviews/specifies

For v1.21:
- ChatGPT = specification/review
- Claude Code = implementation

## When ChatGPT should implement directly instead

Direct patches are still reasonable for:
- tiny CSS repair
- one-line bug fix
- emergency repair with a fully known file context

For multi-file product work, Claude Code working against the live repository is preferred.

## When to stop Claude

Stop implementation and ask for review if Claude reports:
- required Supabase migration
- destructive content migration
- unclear authentication change
- need to remove existing functionality
- conflict with documented architecture
- build cannot pass without unrelated changes
