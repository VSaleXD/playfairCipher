import { useRef, useState } from "react";
import "./App.css";

const ALPHABET = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

function cleanLetters(value) {
  return value
    .toUpperCase()
    .replace(/J/g, "I")
    .replace(/[^A-Z]/g, "");
}

function makeGrid(keyword) {
  return [...new Set([...cleanLetters(keyword), ...ALPHABET])].slice(0, 25);
}

function makePairs(value, decrypt = false) {
  const letters = cleanLetters(value);
  if (decrypt)
    return Array.from({ length: Math.floor(letters.length / 2) }, (_, index) =>
      letters.slice(index * 2, index * 2 + 2),
    );

  const pairs = [];
  let index = 0;
  while (index < letters.length) {
    const first = letters[index];
    const second = letters[index + 1];
    if (!second) {
      pairs.push([first, first === "X" ? "Q" : "X"]);
      index += 1;
    } else if (first === second) {
      pairs.push([first, first === "X" ? "Q" : "X"]);
      index += 1;
    } else {
      pairs.push([first, second]);
      index += 2;
    }
  }
  return pairs;
}

function transform(value, grid, direction, decrypt = false) {
  const positions = new Map(
    grid.map((letter, index) => [letter, [Math.floor(index / 5), index % 5]]),
  );
  return makePairs(value, decrypt)
    .map(([first, second]) => {
      const firstPosition = positions.get(first);
      const secondPosition = positions.get(second);
      if (!firstPosition || !secondPosition) return "";
      if (firstPosition[0] === secondPosition[0]) {
        return [firstPosition, secondPosition]
          .map(
            ([row, column]) => grid[row * 5 + ((column + direction + 5) % 5)],
          )
          .join("");
      }
      if (firstPosition[1] === secondPosition[1]) {
        return [firstPosition, secondPosition]
          .map(
            ([row, column]) => grid[((row + direction + 5) % 5) * 5 + column],
          )
          .join("");
      }
      return (
        grid[firstPosition[0] * 5 + secondPosition[1]] +
        grid[secondPosition[0] * 5 + firstPosition[1]]
      );
    })
    .join("");
}

function getTransformationSteps(value, grid) {
  const positions = new Map(
    grid.map((letter, index) => [letter, [Math.floor(index / 5), index % 5]]),
  );

  return makePairs(value).map(([first, second], index) => {
    const firstPosition = positions.get(first);
    const secondPosition = positions.get(second);
    const output = transform(`${first}${second}`, grid, 1);
    let rule = "Rectangle rule";
    if (firstPosition?.[0] === secondPosition?.[0]) rule = "Same row rule";
    if (firstPosition?.[1] === secondPosition?.[1]) rule = "Same column rule";

    return {
      id: index + 1,
      input: `${first}${second}`,
      output,
      rule,
      firstPosition,
      secondPosition,
      outputPositions: [positions.get(output[0]), positions.get(output[1])],
    };
  });
}

function App() {
  const [key, setKey] = useState("MONARCHY");
  const [grid, setGrid] = useState(() => makeGrid("MONARCHY"));
  const [message, setMessage] = useState("INSTRUMEN RAHASIA");
  const [cipherText, setCipherText] = useState("");
  const [plainText, setPlainText] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTransformation, setActiveTransformation] = useState(0);
  const fileInput = useRef(null);

  const transformations = cipherText
    ? getTransformationSteps(message, grid)
    : [];
  const selectedTransformation =
    transformations[activeTransformation] || transformations[0];

  const updateKey = (value) => {
    setKey(value);
    setGrid(makeGrid(value));
  };

  const updateCell = (index, value) => {
    const letter = cleanLetters(value).slice(-1);
    if (!letter) return;
    const nextGrid = [...grid];
    const oldIndex = nextGrid.indexOf(letter);
    nextGrid[index] = letter;
    if (oldIndex !== -1 && oldIndex !== index) nextGrid[oldIndex] = grid[index];
    setGrid(nextGrid);
    setKey("Matriks manual");
  };

  const encrypt = () => {
    if (!cleanLetters(message))
      return setNotice("Masukkan pesan terlebih dahulu.");
    const result = transform(message, grid, 1);
    setCipherText(result);
    setActiveTransformation(0);
    setNotice("Pesan berhasil dienkripsi.");
  };

  const decrypt = () => {
    const source = cipherText || message;
    if (!cleanLetters(source))
      return setNotice("Masukkan ciphertext terlebih dahulu.");
    const result = transform(source, grid, -1, true)
      .replace(/X(?=[A-Z])|Q(?=X$)/g, "")
      .replace(/[XQ]$/, "");
    setPlainText(result);
    setNotice("Ciphertext berhasil didekripsi.");
  };

  const tryExample = () => {
    const exampleKey = "ALANGESHPUB";
    setKey(exampleKey);
    setGrid(makeGrid(exampleKey));
    setMessage("temui ibu nanti malam");
    setCipherText("");
    setPlainText("");
    setNotice("Contoh Playfair siap digunakan.");
  };

  const resetApp = () => {
    setKey("MONARCHY");
    setGrid(makeGrid("MONARCHY"));
    setMessage("INSTRUMEN RAHASIA");
    setCipherText("");
    setPlainText("");
    setNotice("");
    setActiveTransformation(0);
  };

  const copyResult = async () => {
    if (!cipherText) return setNotice("Belum ada hasil untuk disalin.");
    await navigator.clipboard?.writeText(cipherText);
    setNotice("Ciphertext berhasil disalin.");
  };

  const downloadResult = () => {
    if (!cipherText) return setNotice("Belum ada hasil untuk diunduh.");
    const blob = new Blob([cipherText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "playfair-cipher.txt";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Ciphertext berhasil diunduh.");
  };

  const shareResult = async () => {
    if (!cipherText) return setNotice("Belum ada hasil untuk dibagikan.");
    if (navigator.share) {
      await navigator.share({ title: "Playfair Cipher", text: cipherText });
      setNotice("Ciphertext siap dibagikan.");
      return;
    }
    await navigator.clipboard?.writeText(cipherText);
    setNotice("Browser tidak mendukung Share. Ciphertext disalin.");
  };

  const clearMessage = () => setMessage("");

  const readFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMessage(String(reader.result || ""));
      setNotice(`Berkas ${file.name} berhasil dimuat.`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="page">
      <header className="site-header">
        <div className="brand-mark" aria-hidden="true">
          P
        </div>
        <div className="brand-copy">
          <h1>Playfair Cipher</h1>
          <p>Text Encryption &amp; Decryption</p>
        </div>
      </header>
      <main className="container">
        <section className="intro">
          <div>
            <h2>Encrypt &amp; Decrypt Text</h2>
            <p>
              Your text is processed locally in your browser. We do not save,
              upload, or share your data.
            </p>
          </div>
          <div className="intro-actions">
            <button type="button" className="try-button" onClick={tryExample}>
              Try example
            </button>
            <button type="button" className="reset-button" onClick={resetApp}>
              Reset
            </button>
          </div>
        </section>
        <section className="workspace">
          <div className="form-container">
            <div className="section-heading">
              <div>
                <label htmlFor="message">Input Text</label>
                <p>Type text manually or load a plain text file.</p>
              </div>
              <button
                type="button"
                className="clear-button"
                onClick={clearMessage}
              >
                Clear
              </button>
            </div>
            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Enter a message"
            />
            <div className="input-meta">
              <small>{message.length} characters</small>
              <small>J automatically becomes I</small>
            </div>
            <div className="upload-zone">
              <span className="upload-icon">↥</span>
              <strong>Upload .txt file</strong>
              <small>Drag &amp; drop your file here or browse</small>
              <button
                className="file-button"
                type="button"
                onClick={() => fileInput.current?.click()}
              >
                Choose File
              </button>
              <input
                ref={fileInput}
                type="file"
                accept=".txt,text/plain"
                onChange={readFile}
                hidden
              />
            </div>
            <div className="button-row">
              <button
                className="btn btn-primary"
                type="button"
                onClick={encrypt}
              >
                Encrypt
              </button>
              <button
                className="btn btn-success"
                type="button"
                onClick={decrypt}
              >
                Decrypt
              </button>
            </div>
            {notice && <p className="notice">{notice}</p>}
          </div>
          <aside className="sidebar">
            <div className="key-card form-group">
              <label htmlFor="key">
                Key <sup>*</sup>
              </label>
              <input
                id="key"
                type="text"
                value={key}
                onChange={(event) => updateKey(event.target.value)}
                placeholder="Enter your keyword or key phrase..."
              />
              <small>Used to generate the 5×5 Playfair matrix.</small>
            </div>
            <div className="matrix-section">
              <div className="matrix-title">
                <div>
                  <label>Playfair Matrix</label>
                  <small>5 × 5 grid</small>
                </div>
                <button type="button" onClick={() => updateKey(key)}>
                  Reset
                </button>
              </div>
              <div className="matrix">
                {grid.map((letter, index) => (
                  <input
                    key={index}
                    value={letter}
                    maxLength={1}
                    onChange={(event) => updateCell(index, event.target.value)}
                    aria-label={`Matrix cell ${index + 1}`}
                  />
                ))}
              </div>
              <p className="matrix-note">
                Key word: <strong>{key}</strong>
                <br />
                The matrix is generated automatically from the provided key.
              </p>
            </div>
          </aside>
        </section>
        <section className="result-container">
          <div className="result">
            <div className="result-heading">
              <div>
                <h3>Result</h3>
                <p>Your transformed text will appear here.</p>
              </div>
              <span
                className={cipherText ? "status-badge visible" : "status-badge"}
              >
                ENCRYPTED
              </span>
            </div>
            <div className="result-meta">
              <span>File: Manual input</span>
              <span>Operation: Encryption</span>
              <span>Characters: {cipherText.length}</span>
            </div>
            <textarea
              value={cipherText}
              onChange={(event) => setCipherText(event.target.value)}
              className="result-text"
              placeholder="Cipher text will appear here"
            />
            <div className="result-secondary">
              <label>PlainText</label>
              <textarea
                value={plainText}
                readOnly
                className="result-text"
                placeholder="Plain text will appear here"
              />
            </div>
            <div className="result-actions">
              <button type="button" onClick={copyResult}>
                Copy
              </button>
              <button type="button" onClick={downloadResult}>
                Download .txt
              </button>
              <button type="button" onClick={shareResult}>
                Share
              </button>
            </div>
          </div>
        </section>
        <section className="transformation-section">
          <div className="transformation-heading">
            <div>
              <span className="eyebrow">LEARN BY DOING</span>
              <h2>Transformation</h2>
              <p>Follow one character pair at a time through the key matrix.</p>
            </div>
            <span className="transformation-count">
              {transformations.length
                ? `${activeTransformation + 1} / ${transformations.length}`
                : "Run Encrypt to explore"}
            </span>
          </div>
          {selectedTransformation ? (
            <>
              <div className="transformation-card">
                <div className="pair-heading">
                  <div className="pair-label">
                    PAIR {selectedTransformation.id} OF {transformations.length}
                  </div>
                  <div className="pair-result">
                    <strong>{selectedTransformation.input}</strong>
                    <span>→</span>
                    <strong>{selectedTransformation.output}</strong>
                  </div>
                </div>
                <div className="transformation-controls">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTransformation(
                        Math.max(0, activeTransformation - 1),
                      )
                    }
                    disabled={activeTransformation === 0}
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTransformation(
                        Math.min(
                          transformations.length - 1,
                          activeTransformation + 1,
                        ),
                      )
                    }
                    disabled={
                      activeTransformation === transformations.length - 1
                    }
                  >
                    Next →
                  </button>
                </div>
                <div className="transformation-content">
                  <div className="transform-grid">
                    {grid.map((letter, index) => {
                      const isInput = [
                        selectedTransformation.firstPosition,
                        selectedTransformation.secondPosition,
                      ].some(([row, column]) => index === row * 5 + column);
                      const isOutput =
                        selectedTransformation.outputPositions.some(
                          ([row, column]) => index === row * 5 + column,
                        );
                      return (
                        <span
                          key={index}
                          className={
                            isInput
                              ? "transform-cell input-cell"
                              : isOutput
                                ? "transform-cell output-cell"
                                : "transform-cell"
                          }
                        >
                          {letter}
                        </span>
                      );
                    })}
                  </div>
                  <aside className="rule-card">
                    <span>{selectedTransformation.rule}</span>
                    <div>
                      <strong>{selectedTransformation.input}</strong>
                      <em>→</em>
                      <strong>{selectedTransformation.output}</strong>
                    </div>
                    <p>
                      The arrows show each input character moving to its output
                      cell.
                    </p>
                  </aside>
                </div>
                <div className="transformation-list-heading">
                  <span>View all {transformations.length} transformations</span>
                  <span>⌄</span>
                </div>
                <div className="transformation-list">
                  {transformations.map((step) => (
                    <button
                      type="button"
                      key={step.id}
                      className={
                        step.id === selectedTransformation.id ? "selected" : ""
                      }
                      onClick={() => setActiveTransformation(step.id - 1)}
                    >
                      #{step.id} {step.input} → {step.output}
                    </button>
                  ))}
                </div>
              </div>
              <p className="transformation-note">
                The selected pair follows the row, column, or rectangle rule
                shown in the matrix.
              </p>
            </>
          ) : (
            <div className="empty-transformation">
              Encrypt a message to see each pair move through the matrix.
            </div>
          )}
        </section>
      </main>
      <footer>
        <p>Dibuat oleh Tim IPB University</p>
      </footer>
    </div>
  );
}

export default App;
