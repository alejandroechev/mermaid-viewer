# System Architecture

```mermaid
graph TD
    subgraph "Desktop App (Tauri)"
        CLI["CLI Arguments Parser<br/>(Rust)"]
        Webview["WebView2 Window"]
        TauriCmd["Tauri Commands<br/>(get_initial_diagram)"]
        SQLPlugin["tauri-plugin-sql"]
        SQLiteDB[(SQLite<br/>diagrams.db)]
    end

    subgraph "Frontend (HTML/CSS/JS)"
        Editor["Code Editor<br/>(textarea)"]
        Renderer["Mermaid.js Renderer"]
        PanZoom["Panzoom Controls"]
        LocalStorage["LocalStorage<br/>(auto-save)"]
        SavePanel["Saved Diagrams Panel"]
    end

    subgraph "Web Server (optional)"
        NodeServer["Node.js HTTP Server<br/>(port 8080)"]
    end

    CLI -->|"raw string or .mmd file"| TauriCmd
    TauriCmd -->|"invoke: get_initial_diagram"| Editor
    Webview --> Editor
    Editor -->|"Ctrl+Enter / Render"| Renderer
    Renderer --> PanZoom
    Editor -->|"auto-save"| LocalStorage
    LocalStorage -->|"load on startup"| Editor
    NodeServer -->|"serves static files"| Editor
    SavePanel -->|"save/load/delete"| SQLPlugin
    SQLPlugin --> SQLiteDB
```

## Components

- **Tauri Desktop App**: Rust backend wraps the web frontend in a native WebView2 window. Handles CLI argument parsing and passes diagram content to the frontend via Tauri commands.
- **Frontend**: Pure HTML/CSS/JS with mermaid.js for rendering and panzoom for interactive zoom/pan. Works both in browser and inside the Tauri webview.
- **SQLite Storage**: Diagrams are stored in a local SQLite database (`diagrams.db`) via `tauri-plugin-sql`. Available only in desktop mode.
- **Node.js Server**: Optional lightweight HTTP server for serving the web app in a browser.
