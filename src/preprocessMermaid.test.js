import { describe, it, expect } from 'vitest';
import { preprocessMermaidCode } from './preprocessMermaid.js';

describe('preprocessMermaidCode', () => {
  it('should escape generic type angle brackets in message text', () => {
    const input = 'Conv->>Conv: Create Channel<AudioFrame>';
    const result = preprocessMermaidCode(input);
    expect(result).toBe('Conv->>Conv: Create Channel#lt;AudioFrame#gt;');
  });

  it('should escape Vec<T> patterns', () => {
    const input = 'Cosmos-->>SW: Vec<PublicationSegment>';
    const result = preprocessMermaidCode(input);
    expect(result).toBe('Cosmos-->>SW: Vec#lt;PublicationSegment#gt;');
  });

  it('should preserve valid HTML br tags', () => {
    const input = 'participant App as C# App<br/>(DvrForm)';
    const result = preprocessMermaidCode(input);
    expect(result).toBe('participant App as C# App<br/>(DvrForm)');
  });

  it('should preserve <br> without slash', () => {
    const input = 'participant X as Name<br>Description';
    const result = preprocessMermaidCode(input);
    expect(result).toBe('participant X as Name<br>Description');
  });

  it('should not modify arrow syntax', () => {
    const input = 'A->>B: message';
    const result = preprocessMermaidCode(input);
    expect(result).toBe('A->>B: message');
  });

  it('should not modify dotted arrow syntax', () => {
    const input = 'A-->>B: response';
    const result = preprocessMermaidCode(input);
    expect(result).toBe('A-->>B: response');
  });

  it('should handle multiple angle brackets on different lines', () => {
    const input = [
      'sequenceDiagram',
      '    participant App as App<br/>(Main)',
      '    App->>Server: Send<Data>',
      '    Server-->>App: Vec<Result>',
    ].join('\n');
    const result = preprocessMermaidCode(input);
    expect(result).toContain('App<br/>(Main)');
    expect(result).toContain('Send#lt;Data#gt;');
    expect(result).toContain('Vec#lt;Result#gt;');
  });

  it('should preserve text without angle brackets', () => {
    const input = 'A->>B: simple message without brackets';
    const result = preprocessMermaidCode(input);
    expect(result).toBe(input);
  });

  it('should handle empty input', () => {
    expect(preprocessMermaidCode('')).toBe('');
  });

  it('should handle IAsyncEnumerable generic type', () => {
    const input = 'Conv-->>App: yield AudioFrame via IAsyncEnumerable<AudioFrame>';
    const result = preprocessMermaidCode(input);
    expect(result).toContain('IAsyncEnumerable#lt;AudioFrame#gt;');
  });

  it('should preserve <b>, <i>, <u>, <s> HTML tags', () => {
    const input = 'A->>B: <b>bold</b> and <i>italic</i>';
    const result = preprocessMermaidCode(input);
    expect(result).toBe('A->>B: <b>bold</b> and <i>italic</i>');
  });

  it('should preserve <em> and <strong> tags', () => {
    const input = 'note over A: <em>emphasis</em> and <strong>strong</strong>';
    const result = preprocessMermaidCode(input);
    expect(result).toBe(input);
  });

  it('should preserve <sub> and <sup> tags', () => {
    const input = 'A->>B: H<sub>2</sub>O and x<sup>2</sup>';
    const result = preprocessMermaidCode(input);
    expect(result).toBe(input);
  });

  it('should handle bidirectional flowchart arrows <-->', () => {
    const input = 'A <--> B';
    const result = preprocessMermaidCode(input);
    expect(result).toBe('A <--> B');
  });

  it('should handle the full user-reported diagram without errors', () => {
    const diagram = `sequenceDiagram
    participant App as C# App<br/>(DvrForm)
    participant Conv as RtafConversation
    participant FFI as FFI Channel<br/>(protobuf)
    App->>Conv: StartRecordingAsync(topicId, amsToken)
    Conv->>Conv: Create Channel<AudioFrame>
    Cosmos-->>SW: Vec<PublicationSegment>
    Cosmos-->>SW: Vec<Chunk> (with byte offsets)
    Conv-->>App: yield AudioFrame via IAsyncEnumerable`;

    const result = preprocessMermaidCode(diagram);

    // HTML tags should be preserved
    expect(result).toContain('App<br/>(DvrForm)');
    expect(result).toContain('Channel<br/>(protobuf)');

    // Generic types should be escaped
    expect(result).toContain('Channel#lt;AudioFrame#gt;');
    expect(result).toContain('Vec#lt;PublicationSegment#gt;');
    expect(result).toContain('Vec#lt;Chunk#gt;');

    // Arrow syntax should be untouched
    expect(result).toContain('App->>Conv');
    expect(result).toContain('Conv->>Conv');
    expect(result).toContain('Cosmos-->>SW');
  });
});
