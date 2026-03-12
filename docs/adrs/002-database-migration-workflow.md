# ADR-002: Database Migration Workflow and Defensive Schema Handling

## Status
Accepted

## Context
The Tauri app uses `tauri-plugin-sql` with SQLite to persist saved diagrams.
Database schema changes are defined as sequentially-versioned migrations in
`src-tauri/src/lib.rs`. The plugin runs pending migrations automatically when
the app starts.

A bug was discovered where adding new tables (labels, diagram_labels — migrations
v2 and v3) broke diagram saving on installations that already had the v1 database.
The root cause was twofold:

1. The user was still running the old Tauri binary, so migrations v2/v3 never
   executed. Frontend-only reloads (`tauri dev` with hot-reload) do **not**
   trigger Rust-side migration execution — a full rebuild is required.
2. JavaScript code assumed all tables existed and silently swallowed errors when
   they didn't, making the failure invisible.

## Decision

### Migration workflow
- **Any code change that adds or modifies a SQL migration requires a full Tauri
  rebuild** (`npx tauri build` or restarting `npx tauri dev`). A frontend-only
  reload is not sufficient.
- Each migration must use `CREATE TABLE IF NOT EXISTS` (or equivalent) to be
  idempotent.

### Defensive schema handling
- On database init, validate that all expected tables exist by querying
  `sqlite_master`.
- A `labelsAvailable` flag gates all label-related queries. If label tables are
  missing, core diagram save/load/list still works and label UI is hidden.
- Database errors in save, load, delete, and list operations surface a visible
  status indicator (not just `console.error`).

## Consequences
- Developers must remember to rebuild after migration changes (documented in the
  commit checklist).
- The app degrades gracefully if newer migration tables are absent — users can
  still save and load diagrams.
- Schema validation adds a single lightweight query on startup.
