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

function App() {
  const [key, setKey] = useState("MONARCHY");
  const [grid, setGrid] = useState(() => makeGrid("MONARCHY"));
  const [message, setMessage] = useState("INSTRUMEN RAHASIA");
  const [cipherText, setCipherText] = useState("");
  const [plainText, setPlainText] = useState("");
  const [notice, setNotice] = useState("");
  const fileInput = useRef(null);

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
        <span className="header-link">About</span>
      </header>
      <main className="container">
        <section className="intro">
          <h2>Encrypt &amp; Decrypt Text</h2>
          <p>
            Your text is processed locally in your browser. We do not save,
            upload, or share your data.
          </p>
        </section>
        <section className="workspace">
          <div className="form-container">
            <div className="section-heading">
              <div>
                <label htmlFor="message">Input Text</label>
                <p>Type text manually or load a plain text file.</p>
              </div>
              <span>Clear</span>
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
          </div>
        </section>
      </main>
      <footer>
        <p>Dibuat oleh Tim IPB University</p>
      </footer>
    </div>
  );
}

export default App;
