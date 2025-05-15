# Mermaid Diagram Renderer

A simple web application that allows you to paste Markdown Mermaid syntax and renders the diagram with zooming and panning capabilities.

## Features

- Paste Mermaid syntax and render diagrams
- Interactive zoom and pan functionality
- Keyboard shortcuts (Ctrl+Enter to render)
- Auto-save as you type
- Dark/Light theme toggle
- Template insertion for common diagram types
- Copy diagram as SVG
- Works completely locally

## How to Use

### Option 1: Open the HTML file directly

1. Simply open the `index.html` file in a modern browser (Chrome, Firefox, Edge, etc.)

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

## More Examples

### Flowchart

```
graph LR
    A[Hard edge] -->|Link text| B(Round edge)
    B --> C{Decision}
    C -->|One| D[Result one]
    C -->|Two| E[Result two]
```

### Sequence Diagram

```
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
```

### Class Diagram

```
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
    class Zebra{
        +bool is_wild
        +run()
    }
```
