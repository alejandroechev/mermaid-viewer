document.addEventListener('DOMContentLoaded', function() {
    // Initialize Mermaid
    mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        
    });
    
    // Get DOM elements
    const inputTextarea = document.getElementById('mermaid-input');
    const renderButton = document.getElementById('render-button');
    const outputDiv = document.getElementById('mermaid-output');
    const diagramContainer = document.querySelector('.diagram-container');

    // Panzoom instance
    let panzoomInstance;

    // Function to render the diagram
    async function renderDiagram() {
        const mermaidCode = inputTextarea.value.trim();
        
        if (!mermaidCode) {
            outputDiv.innerHTML = '<p class="error-message">Please enter some Mermaid markdown.</p>';
            return;
        }

        try {
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
                step: 0.1
            });
              // Enable mouse wheel zooming when over the diagram - now without requiring Ctrl key
            diagramContainer.addEventListener('wheel', function(event) {
                // Always prevent default to avoid page scrolling
                event.preventDefault();
                
                const delta = event.deltaY;
                if (delta > 0) {
                    panzoomInstance.zoomOut(0.1, { animate: false });
                } else {
                    panzoomInstance.zoomIn(0.1, { animate: false });
                }
            });
            
            // Add double-click to reset zoom
            diagramContainer.addEventListener('dblclick', function() {
                panzoomInstance.reset();
            });
            
        } catch (error) {
            console.error('Error rendering diagram:', error);
            outputDiv.innerHTML = `<p class="error-message">Error rendering diagram: ${error.message}</p>`;
        }
    }

    // Render initial diagram
    renderDiagram();

    // Render on button click
    renderButton.addEventListener('click', renderDiagram);    // Keyboard shortcuts
    inputTextarea.addEventListener('keydown', function(event) {
        // Ctrl+Enter or Cmd+Enter to render
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            renderDiagram();
        }
    });
    
    // Auto-render on paste
    inputTextarea.addEventListener('paste', function() {
        // Use setTimeout to ensure the pasted content is available
        setTimeout(renderDiagram, 0);
    });
});
