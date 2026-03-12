import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Paste diagram text into the editor, click Render, and wait for result. */
async function renderDiagram(page, diagramCode) {
  const textarea = page.locator('#mermaid-input');
  await textarea.fill(diagramCode);
  await page.click('#render-button');
  // Wait until status indicator moves out of "processing"
  await expect(page.locator('#status-indicator')).not.toHaveClass(/processing/, { timeout: 10_000 });
}

/** Assert diagram rendered successfully (SVG present, no error message). */
async function expectSuccess(page) {
  await expect(page.locator('#mermaid-output svg')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#mermaid-output .error-message')).toHaveCount(0);
}

/** Assert an error message is displayed. */
async function expectError(page, messageSubstring) {
  const errorEl = page.locator('#mermaid-output .error-message');
  await expect(errorEl).toBeVisible({ timeout: 5_000 });
  if (messageSubstring) {
    await expect(errorEl).toContainText(messageSubstring);
  }
}

/** Assert that the rendered SVG contains specific visible text. */
async function expectSvgText(page, text) {
  await expect(page.locator('#mermaid-output svg')).toContainText(text);
}

// ---------------------------------------------------------------------------
// Basic rendering sanity checks (regression guard)
// ---------------------------------------------------------------------------

test.describe('Basic diagram rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders a simple flowchart', async ({ page }) => {
    await renderDiagram(page, `graph TD
      A[Start] --> B[End]`);
    await expectSuccess(page);
    await expectSvgText(page, 'Start');
    await expectSvgText(page, 'End');
  });

  test('renders a simple sequence diagram', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      Alice->>Bob: Hello Bob
      Bob-->>Alice: Hi Alice`);
    await expectSuccess(page);
    await expectSvgText(page, 'Alice');
    await expectSvgText(page, 'Bob');
    await expectSvgText(page, 'Hello Bob');
  });

  test('renders a class diagram', async ({ page }) => {
    await renderDiagram(page, `classDiagram
      class Animal {
        +String name
        +makeSound()
      }
      class Dog {
        +fetch()
      }
      Animal <|-- Dog`);
    await expectSuccess(page);
    await expectSvgText(page, 'Animal');
    await expectSvgText(page, 'Dog');
  });

  test('renders a state diagram', async ({ page }) => {
    await renderDiagram(page, `stateDiagram-v2
      [*] --> Active
      Active --> Inactive
      Inactive --> [*]`);
    await expectSuccess(page);
    await expectSvgText(page, 'Active');
    await expectSvgText(page, 'Inactive');
  });

  test('renders a pie chart', async ({ page }) => {
    await renderDiagram(page, `pie title Pets
      "Dogs" : 38
      "Cats" : 22
      "Birds" : 10`);
    await expectSuccess(page);
  });

  test('renders a gantt chart', async ({ page }) => {
    await renderDiagram(page, `gantt
      title Project Plan
      section Design
        Wireframes :a1, 2024-01-01, 7d
        Mockups    :a2, after a1, 5d`);
    await expectSuccess(page);
    await expectSvgText(page, 'Project Plan');
  });
});

// ---------------------------------------------------------------------------
// Angle bracket preprocessing – positive cases
// ---------------------------------------------------------------------------

test.describe('Angle bracket escaping – generic types render correctly', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('generic type in sequence diagram message text', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      A->>B: Send Channel<AudioFrame> data`);
    await expectSuccess(page);
    await expectSvgText(page, 'Channel<AudioFrame>');
  });

  test('Vec<T> in return message', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      Server-->>Client: Vec<PublicationSegment>`);
    await expectSuccess(page);
    await expectSvgText(page, 'Vec<PublicationSegment>');
  });

  test('generic type followed by parenthetical text', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      DB-->>App: Vec<Chunk> (with byte offsets)`);
    await expectSuccess(page);
    await expectSvgText(page, 'Vec<Chunk>');
  });

  test('IAsyncEnumerable<T> in message', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      Server-->>Client: yield via IAsyncEnumerable<AudioFrame>`);
    await expectSuccess(page);
    await expectSvgText(page, 'IAsyncEnumerable<AudioFrame>');
  });

  test('multiple generic types in same diagram', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      A->>B: Create Channel<AudioFrame>
      B-->>A: Vec<Result>
      A->>C: Map<String>
      C-->>A: List<Item>`);
    await expectSuccess(page);
    await expectSvgText(page, 'Channel<AudioFrame>');
    await expectSvgText(page, 'Vec<Result>');
    await expectSvgText(page, 'Map<String>');
    await expectSvgText(page, 'List<Item>');
  });

  test('generic type in note text', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      A->>B: hello
      note over A,B: Returns Option<Value> here`);
    await expectSuccess(page);
    await expectSvgText(page, 'Option<Value>');
  });

  test('HTML entity &lt; &gt; angle brackets render correctly', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      A->>B: Create Channel&lt;AudioFrame&gt;
      B-->>A: Vec&lt;PublicationSegment&gt;`);
    await expectSuccess(page);
    await expectSvgText(page, 'Channel<AudioFrame>');
    await expectSvgText(page, 'Vec<PublicationSegment>');
  });

  test('mixed raw and HTML entity angle brackets in same diagram', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      A->>B: Raw<Type>
      B-->>A: Entity&lt;Type&gt;`);
    await expectSuccess(page);
    await expectSvgText(page, 'Raw<Type>');
    await expectSvgText(page, 'Entity<Type>');
  });
});

// ---------------------------------------------------------------------------
// Angle bracket preprocessing – HTML tags preserved
// ---------------------------------------------------------------------------

test.describe('Angle bracket escaping – HTML tags preserved', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('<br/> in participant alias creates line break', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      participant A as First Line<br/>Second Line
      A->>A: self`);
    await expectSuccess(page);
    await expectSvgText(page, 'First Line');
    await expectSvgText(page, 'Second Line');
  });

  test('<br> without slash also works', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      participant A as Top<br>Bottom
      A->>A: msg`);
    await expectSuccess(page);
    await expectSvgText(page, 'Top');
    await expectSvgText(page, 'Bottom');
  });

  test('mixed <br/> and generic types in same diagram', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      participant App as My App<br/>(v2.0)
      participant Svc as Service<br/>Layer
      App->>Svc: Send<Data>
      Svc-->>App: Result<Value>`);
    await expectSuccess(page);
    await expectSvgText(page, 'My App');
    await expectSvgText(page, 'Send<Data>');
    await expectSvgText(page, 'Result<Value>');
  });

  test('<b> and <i> tags in flowchart node labels', async ({ page }) => {
    await renderDiagram(page, `graph TD
      A["<b>Bold</b> text"] --> B["<i>Italic</i> text"]`);
    await expectSuccess(page);
  });
});

// ---------------------------------------------------------------------------
// Angle bracket preprocessing – arrow syntax NOT broken
// ---------------------------------------------------------------------------

test.describe('Angle bracket escaping – arrow syntax preserved', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('sequence diagram ->> arrows work', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      A->>B: request
      B-->>A: response
      A->>C: forward
      C-->>A: reply`);
    await expectSuccess(page);
    await expectSvgText(page, 'request');
    await expectSvgText(page, 'response');
  });

  test('flowchart bidirectional <--> arrows work', async ({ page }) => {
    await renderDiagram(page, `graph LR
      A <--> B
      B <--> C`);
    await expectSuccess(page);
    await expectSvgText(page, 'A');
    await expectSvgText(page, 'B');
    await expectSvgText(page, 'C');
  });

  test('flowchart with all arrow styles', async ({ page }) => {
    await renderDiagram(page, `graph LR
      A --> B
      B --- C
      C -.-> D
      D ==> E`);
    await expectSuccess(page);
  });
});

// ---------------------------------------------------------------------------
// Edge cases and regression scenarios
// ---------------------------------------------------------------------------

test.describe('Edge cases – potential regressions from preprocessing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('curly braces in messages are unaffected', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      A->>B: RecordingStarted{topic_id, segment_id}
      B-->>A: QueryComplete{total_frames}`);
    await expectSuccess(page);
    await expectSvgText(page, 'RecordingStarted{topic_id, segment_id}');
  });

  test('parentheses in messages are unaffected', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      A->>B: StartRecordingAsync(topicId, amsToken)
      B->>C: P/Invoke (fire-and-forget)`);
    await expectSuccess(page);
    await expectSvgText(page, 'StartRecordingAsync(topicId, amsToken)');
  });

  test('double colons in messages are unaffected', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      A->>B: RecordingSession::start()
      B->>C: StoreReader::list_segments_by_topic()`);
    await expectSuccess(page);
    await expectSvgText(page, 'RecordingSession::start()');
  });

  test('URLs with slashes in messages', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      A->>B: POST /v1/objects (create doc)
      B->>C: GET /content Range: bytes=0-1024`);
    await expectSuccess(page);
    await expectSvgText(page, 'POST /v1/objects');
  });

  test('diagram with loop, alt, and note blocks', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      A->>B: start
      loop Every 100ms
        B->>C: tick
        alt condition met
          C-->>B: done
        else not met
          C-->>B: continue
        end
      end
      note over A,C: Finished processing`);
    await expectSuccess(page);
    await expectSvgText(page, 'Every 100ms');
    await expectSvgText(page, 'condition met');
  });

  test('angle brackets with spaces inside are escaped', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      A->>B: Result<Some Value>`);
    await expectSuccess(page);
    await expectSvgText(page, 'Result<Some Value>');
  });

  test('multiple angle bracket pairs on same line', async ({ page }) => {
    await renderDiagram(page, `sequenceDiagram
      A->>B: Dict<Key> to List<Value>`);
    await expectSuccess(page);
    await expectSvgText(page, 'Dict<Key>');
    await expectSvgText(page, 'List<Value>');
  });

  test('angle brackets in flowchart node labels', async ({ page }) => {
    await renderDiagram(page, `graph TD
      A["Handler<Request>"] --> B["Response<Data>"]`);
    await expectSuccess(page);
    await expectSvgText(page, 'Handler<Request>');
    await expectSvgText(page, 'Response<Data>');
  });

  test('diagram renders after previous error (recovery)', async ({ page }) => {
    // First render invalid syntax
    await renderDiagram(page, 'this is not valid mermaid at all ~~~');
    await expectError(page);

    // Then render valid diagram
    await renderDiagram(page, `graph TD
      A[Works] --> B[Fine]`);
    await expectSuccess(page);
    await expectSvgText(page, 'Works');
  });

  test('empty input shows error', async ({ page }) => {
    await renderDiagram(page, '');
    await expectError(page, 'Please enter some Mermaid markdown');
  });

  test('very large sequence diagram with generics renders', async ({ page }) => {
    const lines = ['sequenceDiagram'];
    for (let i = 0; i < 20; i++) {
      lines.push(`    A->>B: Send<Type${i}>`);
      lines.push(`    B-->>A: Result<Type${i}>`);
    }
    await renderDiagram(page, lines.join('\n'));
    await expectSuccess(page);
    await expectSvgText(page, 'Send<Type0>');
    await expectSvgText(page, 'Result<Type19>');
  });
});

// ---------------------------------------------------------------------------
// Full user-reported diagram (integration)
// ---------------------------------------------------------------------------

test.describe('Full user-reported diagram', () => {
  test('renders the complete RTAF sequence diagram without parse errors', async ({ page }) => {
    await page.goto('/');

    const diagram = `sequenceDiagram
    participant App as C# App<br/>(DvrForm)
    participant Conv as RtafConversation
    participant FFI as FFI Channel<br/>(protobuf)
    participant Rust as RtafChannelHandler<br/>(rtaf_channel.dll)
    participant SS as streaming_storage
    participant SW as StoreWriter<br/>+ StreamableWriter
    participant Cosmos as Cosmos DB
    participant AMS as AMS Blob Storage

    note over App,AMS: === RECORD PATH ===

    App->>Conv: StartRecordingAsync(topicId, amsToken)
    Conv->>FFI: Send(StartRecording)
    FFI->>Rust: P/Invoke callback
    Rust->>SS: RecordingSession::start()
    SS->>SW: create_segment()
    SW->>AMS: POST /v1/objects (create doc)
    AMS-->>SW: ams_document_id
    SW->>Cosmos: Create PublicationSegment
    SW->>Cosmos: Create SegmentCreated event
    Rust-->>FFI: RecordingStarted{topic_id, segment_id}
    FFI-->>Conv: Deserialize protobuf
    Conv-->>App: RecordingInfo

    loop Every 200ms (mic capture)
        App->>Conv: WriteAudioFrameAsync(timestamp, pcm_data)
        Conv->>FFI: Send(WriteAudioFrame + attachment)
        FFI->>Rust: P/Invoke (fire-and-forget)
        Rust->>SS: session.write_frame()
        SS->>SW: write_frames(protobuf-encoded)
        SW->>SW: Buffer in PendingFrames

        alt Buffer reaches 64KB
            SW->>AMS: PUT /streamable (64KB aligned)
            SW->>Cosmos: Create Chunk doc
            SW->>Cosmos: Create ChunksAppended event
        end
    end

    App->>Conv: SealRecordingAsync()
    Conv->>FFI: Send(SealRecording)
    FFI->>Rust: P/Invoke
    Rust->>SS: session.seal()
    SS->>SW: seal_segment()
    SW->>AMS: PUT final chunk (X-AMS-Last-Chunk)
    SW->>Cosmos: Create final Chunk doc
    SW->>Cosmos: Update segment status=Ended
    SW->>Cosmos: Create SegmentSealed event
    Rust-->>FFI: RecordingSealed{total_frames}
    FFI-->>Conv: Deserialize protobuf
    Conv-->>App: total_frames count

    note over App,AMS: === QUERY PATH ===

    App->>Conv: QueryMediaAsync(options)
    Conv->>Conv: Create Channel<AudioFrame>
    Conv->>FFI: Send(QueryAudio)
    FFI->>Rust: P/Invoke
    Rust->>SS: query_audio(topic, time_range)
    SS->>SW: StoreReader::list_segments_by_topic()
    SW->>Cosmos: SELECT segments WHERE topicId=X
    Cosmos-->>SW: Vec<PublicationSegment>

    loop For each segment
        SS->>SW: StoreReader::download_all_chunks()
        SW->>Cosmos: SELECT chunks WHERE segmentId=Y
        Cosmos-->>SW: Vec<Chunk> (with byte offsets)

        loop For each chunk
            SW->>AMS: GET /content Range: bytes=offset-end
            AMS-->>SW: chunk binary data
        end
    end

    SS->>SS: decode_frames() (protobuf unwrap)
    SS->>SS: decode_opus_to_pcm() (if opus)

    loop For each decoded frame
        Rust-->>FFI: AudioFrame protobuf + attachment
        FFI-->>Conv: Deserialize + copy payload
        Conv-->>App: yield AudioFrame via IAsyncEnumerable
    end

    Rust-->>FFI: QueryComplete{total_frames}
    FFI-->>Conv: Close channel
    Conv-->>App: foreach exits`;

    await renderDiagram(page, diagram);
    await expectSuccess(page);

    // Verify key participants rendered
    await expectSvgText(page, 'RtafConversation');
    await expectSvgText(page, 'streaming_storage');
    await expectSvgText(page, 'Cosmos DB');
    await expectSvgText(page, 'AMS Blob Storage');

    // Verify <br/> tags worked (line breaks in participant names)
    // Note: "C# App<br/>(DvrForm)" renders as just "C" because mermaid
    // interprets # as an entity escape prefix — this is a pre-existing
    // mermaid limitation, not related to angle bracket escaping.
    await expectSvgText(page, '(protobuf)');
    await expectSvgText(page, '(rtaf_channel.dll)');
    await expectSvgText(page, '+ StreamableWriter');

    // Verify generic types rendered with angle brackets
    await expectSvgText(page, 'Channel<AudioFrame>');
    await expectSvgText(page, 'Vec<PublicationSegment>');
    await expectSvgText(page, 'Vec<Chunk>');

    // Verify structural elements
    await expectSvgText(page, '=== RECORD PATH ===');
    await expectSvgText(page, '=== QUERY PATH ===');
    await expectSvgText(page, 'Every 200ms (mic capture)');
    await expectSvgText(page, 'Buffer reaches 64KB');

    // Verify special characters in messages preserved
    await expectSvgText(page, 'RecordingStarted{topic_id, segment_id}');
    await expectSvgText(page, 'RecordingSession::start()');
    await expectSvgText(page, 'POST /v1/objects');
  });
});
