# ADR-001: Use Tauri for Desktop Packaging

## Status
Accepted

## Context
The mermaid renderer was a web-only application (HTML/CSS/JS + optional Node.js server). We needed a way to:
1. Run it as a native desktop application
2. Support CLI invocation to open diagrams from the terminal
3. Work fully offline without network dependencies

## Decision
Use **Tauri v2** as the desktop application framework.

## Rationale
- **Lightweight**: Tauri uses the system WebView (WebView2 on Windows), resulting in small binary sizes (~5-10MB) compared to Electron (~150MB+)
- **Rust backend**: Provides native performance for CLI argument parsing and file I/O
- **Existing frontend reuse**: The existing HTML/CSS/JS frontend works as-is inside the Tauri webview with minimal changes
- **CLI support**: Rust's std::env provides simple CLI argument parsing without additional dependencies
- **Offline**: Frontend dependencies (mermaid.js, panzoom.js) are bundled locally in `libs/`

## Consequences
- Requires Rust toolchain for building
- Build times are longer on first compilation (Rust compiles all dependencies)
- WebView2 is required on Windows (included by default on Windows 10+)
- The web app and desktop app share the same frontend code
