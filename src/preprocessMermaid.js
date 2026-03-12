/**
 * Preprocesses mermaid diagram code to escape angle brackets that would
 * confuse the parser (e.g., generic types like Channel<AudioFrame>),
 * while preserving valid HTML tags (<br/>, <b>, <i>, etc.) and arrow syntax.
 *
 * Uses mermaid's own escape sequences: #lt; for < and #gt; for >
 *
 * @param {string} code - Raw mermaid diagram code
 * @returns {string} - Preprocessed code safe for mermaid parsing
 */
export function preprocessMermaidCode(code) {
  if (!code) return code;

  // HTML tags commonly used in mermaid diagrams
  const VALID_HTML_TAG = /^\/?\s*(br\s*\/?|[bius]|sub|sup|em|strong)\s*$/i;

  return code.replace(/<([^>]+)>/g, (match, inner) => {
    const trimmed = inner.trim();

    // Preserve valid HTML tags (<br/>, <b>, </b>, <i>, <em>, <strong>, etc.)
    if (VALID_HTML_TAG.test(trimmed)) {
      return match;
    }

    // Preserve arrow-like patterns (<--> in flowcharts)
    if (/^[-=.]+$/.test(trimmed)) {
      return match;
    }

    // Preserve HTML comments (<!-- ... -->)
    if (trimmed.startsWith('!--')) {
      return match;
    }

    // Escape everything else using mermaid's own escape sequences
    return `#lt;${inner}#gt;`;
  });
}
