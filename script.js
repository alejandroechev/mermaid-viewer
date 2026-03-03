document.addEventListener('DOMContentLoaded', function () {    // Theme support
    const THEME_KEY = 'mermaid-diagram-theme';
    let currentTheme = localStorage.getItem(THEME_KEY) || 'default';
    
    // Debounce function to limit how often a function can run
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Initialize Mermaid
    mermaid.initialize({
        startOnLoad: false,
        theme: currentTheme,
        securityLevel: 'loose',
    });

    // Local storage key for storing diagram
    const STORAGE_KEY = 'mermaid-diagram-content';    // Get DOM elements
    const inputTextarea = document.getElementById('mermaid-input');
    const renderButton = document.getElementById('render-button');    const outputDiv = document.getElementById('mermaid-output');
    const diagramContainer = document.querySelector('.diagram-container');
    const themeToggle = document.getElementById('theme-toggle');
    const statusIndicator = document.getElementById('status-indicator');
    
    // Add copy button reference
    const copyButton = document.getElementById('copy-svg-button');

    // Saved diagrams panel elements
    const savedPanel = document.getElementById('saved-panel');
    const savedPanelToggle = document.getElementById('saved-panel-toggle');
    const savedList = document.getElementById('saved-list');
    const diagramNameInput = document.getElementById('diagram-name-input');
    const saveDiagramButton = document.getElementById('save-diagram-button');

    // Track currently loaded diagram
    let currentDiagramId = null;
    let currentDiagramName = null;
    let db = null; // SQLite database handle
    // Load saved diagram from local storage if available
    function loadFromLocalStorage() {
        const savedDiagram = localStorage.getItem(STORAGE_KEY);
        if (savedDiagram) {
            inputTextarea.value = savedDiagram;
            return true;
        }
        return false;
    }

    // Save diagram to local storage
    function saveToLocalStorage(diagram) {
        if (diagram && diagram.trim() !== '') {
            localStorage.setItem(STORAGE_KEY, diagram);
        }
    }

    // Check if running inside Tauri and load initial diagram from CLI args
    async function loadFromTauriCli() {
        if (window.__TAURI_INTERNALS__) {
            try {
                const { invoke } = window.__TAURI_INTERNALS__;
                const diagram = await invoke('get_initial_diagram');
                if (diagram) {
                    inputTextarea.value = diagram;
                    return true;
                }
            } catch (e) {
                console.log('Not running in Tauri or no CLI args:', e);
            }
        }
        return false;
    }

    // Function to copy SVG to clipboard
    function copySvgToClipboard() {
        // Find the SVG element in the output
        const svgElement = outputDiv.querySelector('svg');
        
        if (!svgElement) {
            console.error('No SVG found to copy');
            return;
        }
        
        try {
            // Clone the SVG to avoid modifying the displayed one
            const svgClone = svgElement.cloneNode(true);
            
            // Set width and height attributes if not present
            if (!svgClone.getAttribute('width')) {
                svgClone.setAttribute('width', svgElement.getBoundingClientRect().width);
            }
            if (!svgClone.getAttribute('height')) {
                svgClone.setAttribute('height', svgElement.getBoundingClientRect().height);
            }
            
            // Convert SVG to string
            const svgData = new XMLSerializer().serializeToString(svgClone);
            
            // Copy to clipboard
            navigator.clipboard.writeText(svgData).then(() => {
                // Show brief feedback by flashing the button
                copyButton.classList.add('flash');
                setTimeout(() => copyButton.classList.remove('flash'), 500);
            }).catch(err => {
                console.error('Failed to copy SVG: ', err);
            });
        } catch (error) {
            console.error('Error copying SVG: ', error);
        }
    }

    // Panzoom instance
    let panzoomInstance;    // Function to render the diagram
    async function renderDiagram() {
        const mermaidCode = inputTextarea.value.trim();

        // Save to local storage whenever we render
        saveToLocalStorage(mermaidCode);

        if (!mermaidCode) {
            outputDiv.innerHTML = '<p class="error-message">Please enter some Mermaid markdown.</p>';
            statusIndicator.className = 'status-indicator error';
            return;
        }

        try {
            // Show processing status
            statusIndicator.className = 'status-indicator processing';
            
            // Clear previous diagram
            outputDiv.innerHTML = '';

            // Create a container with an id for Mermaid
            const graphDiv = document.createElement('div');
            graphDiv.className = 'mermaid';
            graphDiv.textContent = mermaidCode;
            outputDiv.appendChild(graphDiv);

            // Render diagram
            await mermaid.run({ nodes: [graphDiv] });

            // Initialize panzoom after diagram render
            if (panzoomInstance) {
                panzoomInstance.destroy();
            }

            // Initialize panzoom on the output div
            panzoomInstance = Panzoom(outputDiv, {
                canvas: true,
                step: 0.06
            });
            // Enable mouse wheel zooming when over the diagram - now without requiring Ctrl key
            diagramContainer.addEventListener('wheel', function (event) {
                // Always prevent default to avoid page scrolling
                event.preventDefault();

                const delta = event.deltaY;
                if (delta > 0) {
                    panzoomInstance.zoomOut(0.005, { animate: false });
                } else {
                    panzoomInstance.zoomIn(0.005, { animate: false });
                }
            });

            // Add double-click to reset zoom
            diagramContainer.addEventListener('dblclick', function () {
                panzoomInstance.reset();
            });            // Save diagram to local storage
            saveToLocalStorage(mermaidCode);
            
            // Show success status
            statusIndicator.className = 'status-indicator success';
            
            // Auto-hide status after 2 seconds
            setTimeout(() => {
                statusIndicator.className = 'status-indicator';
            }, 2000);

        } catch (error) {
            console.error('Error rendering diagram:', error);
            outputDiv.innerHTML = `<p class="error-message">Error rendering diagram: ${error.message}</p>`;
            
            // Show error status
            statusIndicator.className = 'status-indicator error';
        }
    }    // Render initial diagram - try Tauri CLI args first, then localStorage, then default
    loadFromTauriCli().then(loadedFromCli => {
        if (!loadedFromCli) {
            loadFromLocalStorage();
        }
        renderDiagram();
    });

    // Render on button click
    renderButton.addEventListener('click', renderDiagram);
      // Add copy SVG button event listener
    if (copyButton) {
        copyButton.addEventListener('click', copySvgToClipboard);
    }
    
    // Theme toggle functionality
    themeToggle.addEventListener('click', function() {
        // Toggle between default and dark themes
        currentTheme = currentTheme === 'default' ? 'dark' : 'default';
        
        // Save to local storage
        localStorage.setItem(THEME_KEY, currentTheme);
        
        // Update Mermaid config
        mermaid.initialize({
            startOnLoad: false,
            theme: currentTheme,
            securityLevel: 'loose',
        });
        
        // Re-render the diagram with new theme
        renderDiagram();
    });

    // Keyboard shortcuts
    inputTextarea.addEventListener('keydown', function (event) {
        // Ctrl+Enter or Cmd+Enter to render
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            renderDiagram();
        }
    });    // Auto-render on paste
    inputTextarea.addEventListener('paste', function () {
        // Use setTimeout to ensure the pasted content is available
        setTimeout(renderDiagram, 0);
    });
    
    // Auto-save (but not auto-render) as user types with a 500ms debounce
    const debouncedSave = debounce(function() {
        const mermaidCode = inputTextarea.value.trim();
        if (mermaidCode) {
            saveToLocalStorage(mermaidCode);
            // Show brief success indicator without full render
            statusIndicator.className = 'status-indicator success';
            setTimeout(() => {
                statusIndicator.className = 'status-indicator';
            }, 500);
        }
    }, 500);
      // Add input event listener for auto-save
    inputTextarea.addEventListener('input', debouncedSave);
    
    // Templates for different diagram types
    const templates = {
        flowchart: `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`,
        sequence: `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!`,
        classDiagram: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal: +int age
    Animal: +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }`,
        gantt: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2023-01-01, 30d
    Another task     :after a1, 20d
    section Another
    Task in sec      :2023-01-12, 12d
    another task     :24d`
    };
      // Add template insertion functionality
    document.querySelectorAll('.template-item').forEach(button => {
        button.addEventListener('click', function() {
            const templateType = this.getAttribute('data-type');
            const template = templates[templateType];
            
            if (template) {
                // Replace content or ask before replacing if there's existing content
                if (inputTextarea.value.trim() !== '') {
                    if (confirm('Replace current diagram with template?')) {
                        inputTextarea.value = template;
                        renderDiagram();
                    }
                } else {
                    inputTextarea.value = template;
                    renderDiagram();
                }
            }
        });
    });
      // Improve tooltip interaction
    document.querySelectorAll('.tooltip-container').forEach(container => {
        const button = container.querySelector('button');
        const tooltip = container.querySelector('.tooltip');
        let tooltipTimeout;
        
        if (!tooltip || !button) return;
        
        // Show tooltip on button mouseenter
        button.addEventListener('mouseenter', () => {
            clearTimeout(tooltipTimeout);
            tooltip.classList.add('visible');
        });
        
        // Hide tooltip on button mouseleave, with delay
        button.addEventListener('mouseleave', (event) => {
            // Check if mouse is moving toward the tooltip
            const toTooltip = event.relatedTarget === tooltip || tooltip.contains(event.relatedTarget);
            
            if (!toTooltip) {
                tooltipTimeout = setTimeout(() => {
                    if (!tooltip.matches(':hover')) {
                        tooltip.classList.remove('visible');
                    }
                }, 100);
            }
        });
        
        // Keep tooltip visible when hovering over it
        tooltip.addEventListener('mouseenter', () => {
            clearTimeout(tooltipTimeout);
        });
        
        // Hide tooltip with delay when leaving it
        tooltip.addEventListener('mouseleave', (event) => {
            // Check if mouse is moving to the button
            const toButton = event.relatedTarget === button;
            
            if (!toButton) {
                tooltipTimeout = setTimeout(() => {
                    tooltip.classList.remove('visible');
                }, 300);
            }
        });
    });

    // ===== Saved Diagrams (Tauri + SQLite only) =====
    async function initSavedDiagrams() {
        if (!window.__TAURI_INTERNALS__) return;

        // Show the toggle button in Tauri mode
        savedPanelToggle.style.display = 'flex';

        // Use Tauri invoke to interact with the SQL plugin
        try {
            // Load/open the database first
            await window.__TAURI_INTERNALS__.invoke('plugin:sql|load', {
                db: 'sqlite:diagrams.db'
            });
            db = {
                async select(query, bindings) {
                    return await window.__TAURI_INTERNALS__.invoke('plugin:sql|select', {
                        db: 'sqlite:diagrams.db', query, values: bindings || []
                    });
                },
                async execute(query, bindings) {
                    return await window.__TAURI_INTERNALS__.invoke('plugin:sql|execute', {
                        db: 'sqlite:diagrams.db', query, values: bindings || []
                    });
                }
            };
        } catch (e) {
            console.error('Failed to initialize SQL database:', e);
            return;
        }

        // Toggle panel visibility
        savedPanelToggle.addEventListener('click', () => {
            savedPanel.classList.toggle('visible');
            savedPanelToggle.classList.toggle('active');
            if (savedPanel.classList.contains('visible')) {
                refreshSavedList();
            }
        });

        // Save button
        saveDiagramButton.addEventListener('click', saveDiagram);

        // Save on Enter in the name input
        diagramNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveDiagram();
        });

        // Load the saved list initially
        refreshSavedList();
    }

    async function saveDiagram() {
        if (!db) return;
        const name = diagramNameInput.value.trim();
        const content = inputTextarea.value.trim();

        if (!name) {
            diagramNameInput.focus();
            return;
        }
        if (!content) return;

        try {
            if (currentDiagramId && currentDiagramName === name) {
                // Update existing diagram
                await db.execute(
                    "UPDATE diagrams SET content = ?, updated_at = datetime('now') WHERE id = ?",
                    [content, currentDiagramId]
                );
            } else {
                // Insert or replace by name
                await db.execute(
                    "INSERT INTO diagrams (name, content) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET content = excluded.content, updated_at = datetime('now')",
                    [name, content]
                );
                // Fetch the id of the saved diagram
                const rows = await db.select("SELECT id FROM diagrams WHERE name = ?", [name]);
                if (rows.length > 0) {
                    currentDiagramId = rows[0].id;
                    currentDiagramName = name;
                }
            }
            refreshSavedList();
            statusIndicator.className = 'status-indicator success';
            setTimeout(() => { statusIndicator.className = 'status-indicator'; }, 1000);
        } catch (e) {
            console.error('Failed to save diagram:', e);
            statusIndicator.className = 'status-indicator error';
        }
    }

    async function loadDiagram(id) {
        if (!db) return;
        try {
            const rows = await db.select("SELECT * FROM diagrams WHERE id = ?", [id]);
            if (rows.length > 0) {
                const diagram = rows[0];
                inputTextarea.value = diagram.content;
                diagramNameInput.value = diagram.name;
                currentDiagramId = diagram.id;
                currentDiagramName = diagram.name;
                renderDiagram();
                refreshSavedList();
            }
        } catch (e) {
            console.error('Failed to load diagram:', e);
        }
    }

    async function deleteDiagram(id) {
        if (!db) return;
        try {
            await db.execute("DELETE FROM diagrams WHERE id = ?", [id]);
            if (currentDiagramId === id) {
                currentDiagramId = null;
                currentDiagramName = null;
                diagramNameInput.value = '';
            }
            refreshSavedList();
        } catch (e) {
            console.error('Failed to delete diagram:', e);
        }
    }

    async function refreshSavedList() {
        if (!db) return;
        try {
            const rows = await db.select("SELECT id, name, updated_at FROM diagrams ORDER BY updated_at DESC");
            savedList.innerHTML = '';
            for (const row of rows) {
                const item = document.createElement('div');
                item.className = 'saved-item' + (row.id === currentDiagramId ? ' active' : '');

                const nameSpan = document.createElement('span');
                nameSpan.className = 'saved-item-name';
                nameSpan.textContent = row.name;
                nameSpan.title = row.name;

                const dateSpan = document.createElement('span');
                dateSpan.className = 'saved-item-date';
                dateSpan.textContent = row.updated_at ? row.updated_at.substring(5, 16) : '';

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'saved-item-delete';
                deleteBtn.textContent = '🗑';
                deleteBtn.title = 'Eliminar';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteDiagram(row.id);
                });

                item.addEventListener('click', () => loadDiagram(row.id));
                item.appendChild(nameSpan);
                item.appendChild(dateSpan);
                item.appendChild(deleteBtn);
                savedList.appendChild(item);
            }
        } catch (e) {
            console.error('Failed to refresh saved list:', e);
        }
    }

    // Ctrl+S to save
    document.addEventListener('keydown', function(event) {
        if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            if (!db) return;
            if (!savedPanel.classList.contains('visible')) {
                savedPanel.classList.add('visible');
                savedPanelToggle.classList.add('active');
            }
            if (currentDiagramName) {
                diagramNameInput.value = currentDiagramName;
                saveDiagram();
            } else {
                diagramNameInput.focus();
            }
        }
    });

    // Initialize saved diagrams if in Tauri
    initSavedDiagrams();
});
