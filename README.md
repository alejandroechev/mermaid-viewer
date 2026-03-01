# Mermaid Diagram Renderer

A desktop and web application for rendering Mermaid diagrams with zooming, panning, and CLI support. Built with Tauri for native desktop experience.

## Features

- Paste Mermaid syntax and render diagrams
- Interactive zoom and pan functionality
- Keyboard shortcuts (Ctrl+Enter to render)
- Auto-save as you type
- Dark/Light theme toggle
- Template insertion for common diagram types
- Copy diagram as SVG
- **Desktop app with CLI support** — open diagrams from the terminal
- Works completely locally (offline)

## Desktop App (Tauri)

### Installation

#### From source
```bash
npm install
npx tauri build
```

The built binary is at `src-tauri/target/release/mermaid-viewer.exe`.

To make it available system-wide, copy to a PATH directory:
```bash
copy src-tauri\target\release\mermaid-viewer.exe %USERPROFILE%\.cargo\bin\
```

### CLI Usage

Open with a raw mermaid string:
```bash
mermaid-viewer "graph TD; A[Start]-->B[End]"
```

Open with a `.mmd` file:
```bash
mermaid-viewer diagram.mmd
```

Open without arguments (loads last saved diagram):
```bash
mermaid-viewer
```

The tool auto-detects whether the argument is a file path or a raw mermaid string.

## Web App

### Option 1: Open the HTML file directly

Simply open the `index.html` file in a modern browser (Chrome, Firefox, Edge, etc.)

### Option 2: Use the Node.js server

1. Make sure you have [Node.js](https://nodejs.org/) installed
2. Open a terminal/command prompt in this directory
3. Run the server: `node server.js`
4. Open your browser and navigate to: `http://localhost:8080`

## Usage Instructions

1. Paste your Mermaid syntax in the left textarea
2. Click "Render" or press Ctrl+Enter
3. Use mouse wheel to zoom in/out
4. Click and drag on the diagram to pan around
5. Double-click to reset the view to default

### Additional Features

- Click the "🌓" button to toggle between light and dark themes
- Click "+" to insert a template for different diagram types
- Click "?" to view keyboard shortcuts
- Click "Copy SVG" to copy the diagram as SVG code for use in other applications

## Example Mermaid Syntax

```
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
```

## Architecture

See [docs/system-diagram.md](docs/system-diagram.md) for the system architecture diagram.

## Development

### Prerequisites
- Node.js 18+
- Rust toolchain (for Tauri desktop app)
- npm

### Building
```bash
npm install
npx tauri build      # Desktop app
node server.js       # Web server
```
