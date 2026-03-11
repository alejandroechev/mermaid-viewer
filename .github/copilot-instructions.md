# MedicalData App

## Description

An app to render mermaid diagrams

## Code Implementation Flow

<important>Mandatory Development Loop (non-negotiable)</important>

### Pre-Development
- **Read ADRs** Before starting any development work, read all Architecture Decision Records in `docs/adrs/` to understand existing design decisions and constraints. Do not contradict or duplicate existing ADRs without explicit user approval.

### Architecture
- **Typescript** Use Typescript as default language, unless told otherwise
- **Tauri** For desktop apps use Tauri framework
- **PWA** For mobile apps, build them as Progressive WebApps
- **Domain Logic Separation** Separate domain logic from CLI/UI/WebAPI
- **CLI** Always implement a CLI with feature parity to WebAPI/UI layer. This is a tool for you as an agent to validate your work
- **Language Convention** UI text visible to users is in Spanish. All code (variables, functions, types, comments), documentation, and test descriptions must be in English.
- **In-Memory Stubs for External Integrations** For every external service integration (databases, APIs, third-party services), implement an in-memory stub that conforms to the same interface. Use a provider/factory that auto-selects the real implementation when credentials are configured, and falls back to the in-memory stub when they are not. This ensures E2E tests, CLI validation, and local development work fully offline without external dependencies.

### Git Workflow
- **Work directly on master** — solo developer, no branch overhead
- **Commit after every completed unit of work** — never leave working code uncommitted
- **Push after each work session** — remote backup is non-negotiable. Remote for this repo at https://github.com/alejandroechev/mermaid-viewer.git
- **Tag milestones**: `git tag v0.1.0-mvp` when deploying or reaching a checkpoint
- **Branch only for risky experiments** you might discard — delete after merge or abandon

### Coding — TDD Workflow (strict, per-function)

<important>For EVERY function, component, or module you implement, follow this exact sequence. Do NOT skip steps or batch them.</important>

1. **RED** — Write a failing test FIRST. Run it. Confirm it fails. Show the failure output.
2. **GREEN** — Write the MINIMUM implementation code to make the test pass. Run the test. Confirm it passes.
3. **REFACTOR** — Clean up if needed. Run the test again to confirm it still passes.
4. Repeat for the next behavior/function.

<important>NEVER write implementation code without a pre-existing failing test. If you catch yourself writing code first, STOP, delete it, and write the test first.</important>

### Coding — E2E and CLI Tests (per-feature, not batched)

For every user-facing feature, before considering it complete:
- **E2E Test** — Write a Playwright E2E test that exercises the feature end-to-end. Run it. Confirm it passes.
- **CLI Scenario** — Write a CLI scenario AND execute it using the CLI. Confirm the output matches expectations.

### Validation — Pre-Commit Gate

<important>You CANNOT commit until ALL of the following pass. This is a gate, not a suggestion. Run these exact commands before every `git commit`:</important>

```bash
# 1. All unit tests pass with coverage above 90%
npx vitest run --coverage
# STOP if coverage < 90%. Add tests until coverage ≥ 90%.

# 2. All E2E tests pass
npx playwright test
# STOP if any E2E test fails. Fix the issue.

# 3. TypeScript compiles cleanly
npx tsc -b
# STOP if there are type errors. Fix them.

# 4. Visual validation (UI features only)
# Take screenshots using Playwright MCP of every screen affected by the change.
# Review each screenshot visually. Store in screenshots/ folder.
# If Playwright MCP is not available, STOP and tell the user.
```

<important>If any validation step fails, fix the underlying issue. NEVER delete pre-existing tests or scenarios unless the user explicitly asks you to.</important>

### Documentation
- **README** Update readme file with any relevant public change to the app
- **System Diagram** Keep always up to date a mermaid system level diagram of the app architecture in docs/system-diagram.md
- **ADR** For every major design and architecture decision add an Architecture Decision Record in docs/adrs

### Commit Checklist

Before running `git commit`, mentally verify:
- [ ] Every new function/component was built with TDD (red → green → refactor)?
- [ ] E2E tests exist for every new user-facing feature?
- [ ] CLI scenarios exist and have been executed for every new feature?
- [ ] `npx vitest run --coverage` shows ≥ 90% statement coverage?
- [ ] `npx playwright test` — all E2E tests pass?
- [ ] `npx tsc -b` — zero type errors?
- [ ] Visual screenshots taken and reviewed (if UI feature)?
- [ ] README updated (if public-facing change)?
- [ ] System diagram updated (if architecture changed)?
- [ ] ADR written (if major design decision)?

### Post-Feature Build
- **Always build the Tauri executable** after implementing a new feature. Run `npx tauri build` to produce the updated `.exe` and installers. The feature is not considered complete until the desktop binary is built successfully.

### Deployment
- **CI/CD** is handled by GitHub Actions (`.github/workflows/ci-cd.yml`). Push to `master` triggers: TypeScript check → unit tests with coverage → E2E tests → build → deploy to Vercel.
- **Vercel auto-deploy is disabled** (`vercel.json` → `github.enabled: false`). Deployments ONLY happen through the GitHub Actions pipeline after all tests pass.
- **If any CI step fails, deployment is skipped.** No manual rollback needed — the previous production deployment stays live.
- **Production URL:** PENDING
- **Never deploy manually** with `vercel deploy`. Always push to `master` and let CI/CD handle it.
