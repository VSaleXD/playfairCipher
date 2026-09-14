import { useState, useRef } from "react";
import { generateMatrix, processPlayfair } from "./playfair.js";

function Icon({ name, className = "" }) {
  const props = {
    className: `h-5 w-5 ${className}`,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  const icons = {
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    key: (
      <>
        <circle cx="8" cy="15" r="3" />
        <path d="m10.5 12.5 7-7M15 7l2 2m-4 0 2 2" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </>
    ),
    upload: <path d="M12 16V4m0 0-4 4m4-4 4 4M5 20h14" />,
    copy: (
      <>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
      </>
    ),
    download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />,
    share: (
      <>
        <circle cx="18" cy="5" r="2.5" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="19" r="2.5" />
        <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
      </>
    ),
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
  };

  return <svg {...props}>{icons[name]}</svg>;
}

function MatrixVisualization({ matrix, source, output }) {
  const findPos = (letter) => {
    const row = matrix.findIndex((r) => r.includes(letter));
    return { row, column: matrix[row]?.indexOf(letter) ?? -1 };
  };

  const inputA = findPos(source[0]);
  const inputB = findPos(source[1]);
  const outA = findPos(output[0]);
  const outB = findPos(output[1]);

  const ruleName =
    inputA.row === inputB.row
      ? "Same row"
      : inputA.column === inputB.column
      ? "Same column"
      : "Rectangle";

  const getCenter = ({ row, column }) => ({
    x: 10 + column * 20,
    y: 10 + row * 20,
  });

  const getPath = (from, to, side) => {
    const fromCenter = getCenter(from);
    const toCenter = getCenter(to);

    if (side === "left" || side === "right") {
      const fromX = side === "left" ? from.column * 20 + 1 : from.column * 20 + 19;
      const toX = side === "left" ? to.column * 20 + 1 : to.column * 20 + 19;
      const controlX =
        side === "left"
          ? Math.min(fromX, toX) - 13
          : Math.max(fromX, toX) + 13;
      return `M ${fromX} ${fromCenter.y} Q ${controlX} ${(fromCenter.y + toCenter.y) / 2} ${toX} ${toCenter.y}`;
    }

    const fromY = side === "top" ? from.row * 20 + 1 : from.row * 20 + 19;
    const toY = side === "top" ? to.row * 20 + 1 : to.row * 20 + 19;
    const controlY =
      side === "top"
        ? Math.min(fromY, toY) - 13
        : Math.max(fromY, toY) + 13;
    return `M ${fromCenter.x} ${fromY} Q ${(fromCenter.x + toCenter.x) / 2} ${controlY} ${toCenter.x} ${toY}`;
  };

  const pickSide = (from, to, fallback) => {
    if (from.row === to.row) return from.row < 2.5 ? "top" : "bottom";
    if (from.column === to.column) return from.column < 2.5 ? "left" : "right";
    return fallback;
  };

  let sideA = pickSide(inputA, outA, "top");
  let sideB = pickSide(inputB, outB, "bottom");

  if (sideA === sideB) {
    [sideA, sideB] =
      sideA === "top" || sideA === "left"
        ? [sideA, sideA === "top" ? "bottom" : "right"]
        : [sideA === "bottom" ? "top" : "left", sideA];
  }

  const getCellClass = (letter) => {
    const isInput = source.includes(letter);
    const isOutput = output.includes(letter);
    if (isInput && isOutput) {
      return "border-violet-400 bg-violet-100 text-violet-800 ring-1 ring-violet-300";
    }
    if (isInput) {
      return "border-amber-400 bg-amber-100 text-amber-900 ring-1 ring-amber-300";
    }
    if (isOutput) {
      return "border-emerald-500 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300";
    }
    return "border-[#e5e7eb] bg-white text-[#4b5563]";
  };

  return (
    <div className="mt-5 grid items-center gap-5 md:grid-cols-[1fr_210px]">
      <div className="mx-auto w-full max-w-[310px]">
        <div className="relative">
          <div className="relative z-10 grid grid-cols-5 gap-1.5">
            {matrix.flat().map((letter, idx) => (
              <span
                key={`${letter}-${idx}`}
                className={`${source.includes(letter) || output.includes(letter) ? "matrix-cell" : ""} grid aspect-square place-items-center rounded-md border font-mono text-sm font-bold transition ${getCellClass(letter)}`}
                style={{
                  animationDelay: `${output.includes(letter) ? 260 : 0}ms`,
                }}
              >
                {letter}
              </span>
            ))}
          </div>
          <svg
            className="pointer-events-none absolute inset-0 z-20 size-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-label={`Arrows show ${source[0]} moving to ${output[0]} and ${source[1]} moving to ${output[1]}`}
          >
            <defs>
              <marker
                id="pair-arrow-a"
                markerWidth="5"
                markerHeight="5"
                refX="4"
                refY="2.5"
                orient="auto"
              >
                <path d="M0,0 L5,2.5 L0,5 Z" fill="#059669" />
              </marker>
              <marker
                id="pair-arrow-b"
                markerWidth="5"
                markerHeight="5"
                refX="4"
                refY="2.5"
                orient="auto"
              >
                <path d="M0,0 L5,2.5 L0,5 Z" fill="#047857" />
              </marker>
            </defs>
            <path
              d={getPath(inputA, outA, sideA)}
              key={`${source}-${output}-a`}
              className="matrix-path matrix-path-a"
              fill="none"
              stroke="#059669"
              strokeWidth="1.1"
              strokeDasharray="2 1"
              markerEnd="url(#pair-arrow-a)"
            />
            <path
              d={getPath(inputB, outB, sideB)}
              key={`${source}-${output}-b`}
              className="matrix-path matrix-path-b"
              fill="none"
              stroke="#047857"
              strokeWidth="1.1"
              strokeDasharray="2 1"
              markerEnd="url(#pair-arrow-b)"
            />
          </svg>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-[#6b7280]">
          <span>
            <i className="mr-1 inline-block size-2 rounded-sm bg-amber-300" />
            Input
          </span>
          <span>
            <i className="mr-1 inline-block size-2 rounded-sm bg-emerald-300" />
            Output
          </span>
          <span>
            <i className="mr-1 inline-block size-2 rounded-sm bg-violet-300" />
            Both
          </span>
        </div>
      </div>
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 text-center">
        <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">
          {ruleName} rule
        </p>
        <div className="mt-3 flex items-center justify-center gap-2 font-mono text-xl font-bold">
          <span className="rounded-lg bg-amber-100 px-2.5 py-1.5 text-amber-900">
            {source}
          </span>
          <Icon name="arrow" className="text-[#9ca3af]" />
          <span className="rounded-lg bg-emerald-100 px-2.5 py-1.5 text-emerald-800">
            {output}
          </span>
        </div>
        <p className="mt-3 text-xs leading-5 text-[#6b7280]">
          The arrows show each input character moving to its output cell.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [inputText, setInputText] = useState("");
  const [key, setKey] = useState("");
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [loadingOperation, setLoadingOperation] = useState(null);
  const [result, setResult] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const fileInputRef = useRef(null);
  const resultRef = useRef(null);

  const matrix = key.trim() ? generateMatrix(key) : null;

  const showToast = (message) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 2800);
  };

  const handleFile = (uploadedFile) => {
    if (!uploadedFile) return;
    if (!uploadedFile.name.toLowerCase().endsWith(".txt")) {
      setError("Only .txt files are supported.");
      return;
    }
    if (uploadedFile.size > 1024 * 1024) {
      setError("File is too large. Please choose a .txt file under 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setInputText(String(reader.result ?? ""));
      setFile(uploadedFile);
      setError("");
      showToast("Text file loaded successfully.");
    };
    reader.onerror = () => {
      setError("Unable to read this file. Please try another .txt file.");
    };
    reader.readAsText(uploadedFile);
  };

  const handleFileInputChange = (e) => {
    handleFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleProcess = (operation) => {
    if (!inputText.trim()) {
      setError("Please enter text or upload a .txt file.");
      return;
    }
    if (!key.trim()) {
      setError("Please enter a key.");
      return;
    }
    setError("");
    setLoadingOperation(operation);
    window.setTimeout(() => {
      try {
        setResult({
          ...processPlayfair(inputText, key, operation),
          operation,
          source: file?.name ?? "Manual Input",
          originalLength: inputText.length,
        });
        setActiveStepIndex(0);
        setLoadingOperation(null);
        window.setTimeout(() => {
          resultRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 80);
      } catch {
        setLoadingOperation(null);
        setError("Something went wrong. Please check your input and key.");
      }
    }, 450);
  };

  const copyResult = async () => {
    if (result) {
      await navigator.clipboard.writeText(result.result);
      setCopied(true);
      showToast("Result copied to clipboard.");
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const baseName = file?.name.replace(/\.txt$/i, "") ?? "playfair";
    const opSuffix = result.operation === "encrypt" ? "encrypted" : "decrypted";
    const blob = new Blob([result.result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}_${opSuffix}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("File downloaded successfully.");
  };

  const shareResult = async () => {
    if (!result) return;
    const shareText = `Playfair Cipher Result\n\nOperation: ${
      result.operation === "encrypt" ? "Encryption" : "Decryption"
    }\n\nResult:\n${result.result.slice(0, 6000)}${
      result.result.length > 6000 ? "\n\n[Result truncated for sharing]" : ""
    }`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Playfair Cipher Result",
          text: shareText,
        });
        showToast("Share sheet opened.");
      } else {
        await navigator.clipboard.writeText(shareText);
        showToast("Sharing is unavailable here. Result copied to clipboard.");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        showToast("Could not open the share sheet.");
      }
    }
  };

  const handleTryExample = () => {
    setInputText("temui ibu nanti malam");
    setKey("ALANGESHPUB");
    setFile(null);
    setResult(null);
    setError("");
    setActiveStepIndex(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    showToast("Example text and key are ready to encrypt.");
  };

  const handleReset = () => {
    setInputText("");
    setKey("");
    setFile(null);
    setResult(null);
    setError("");
    setActiveStepIndex(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    showToast("Workspace reset.");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#111827] selection:bg-emerald-100">
      <header className="sticky top-0 z-20 border-b border-[#e5e7eb] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1160px] items-center justify-between px-5 sm:px-7">
          <a
            href="#top"
            className="flex items-center gap-3"
            aria-label="Playfair Cipher home"
          >
            <span className="grid size-10 place-items-center overflow-hidden rounded-xl bg-[#eef0ff] shadow-sm">
              <img src="/workshop.png" alt="Workshop logo" className="size-8 object-contain" />
            </span>
            <span>
              <strong className="block text-[15px] tracking-tight">
                Playfair Cipher Workshop
              </strong>
              <span className="block text-xs text-[#6b7280]">
                Text Encryption & Decryption · Kelompok 4
              </span>
            </span>
          </a>
          <nav className="flex items-center gap-2 text-sm font-medium text-[#6b7280] sm:gap-5">
            <a
              href="/02%20Kriptografi%20Klasik%202023.pdf"
              target="_blank"
              rel="noreferrer"
              className="hidden transition hover:text-emerald-700 sm:inline"
            >
              Modul PDF
            </a>
            <a
              href="/playfair_rawcode.cpp"
              target="_blank"
              rel="noreferrer"
              className="hidden transition hover:text-emerald-700 sm:inline"
            >
              Source C++
            </a>
            <button
              onClick={() => setIsAboutOpen(true)}
              className="transition hover:text-emerald-700 cursor-pointer"
            >
              About
            </button>
          </nav>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-[1160px] px-5 py-10 sm:px-7 sm:py-14">
        <section className="mb-10 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            Encrypt & Decrypt Text
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-[#6b7280]">
            Your text is processed locally in your browser. We do not save,
            upload, or share your data.
          </p>
        </section>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03)] sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Input Text</h2>
                <p className="mt-1 text-sm text-[#6b7280]">
                  Type text manually or load a plain text file.
                </p>
              </div>
              <button
                onClick={() => {
                  setInputText("");
                  setFile(null);
                  setError("");
                }}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#6b7280] transition hover:bg-gray-100 hover:text-[#111827] cursor-pointer"
              >
                Clear
              </button>
            </div>

            <label className="sr-only" htmlFor="cipher-text">
              Text to encrypt or decrypt
            </label>
            <textarea
              id="cipher-text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setFile(null);
              }}
              placeholder="Put your text to encrypt/decrypt here..."
              className="mt-5 min-h-44 w-full resize-y rounded-xl border border-[#d9dee6] bg-[#fbfcfd] p-4 font-mono text-sm leading-6 outline-none transition placeholder:font-sans placeholder:text-[#9ca3af] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />

            <div className="mt-2 flex justify-between text-xs text-[#9ca3af]">
              <span>{file ? `Source: ${file.name}` : "Manual input"}</span>
              <span>{inputText.length} characters</span>
            </div>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#e5e7eb]" />
              <span className="font-mono text-xs font-bold tracking-widest text-[#9ca3af]">
                OR
              </span>
              <div className="h-px flex-1 bg-[#e5e7eb]" />
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`rounded-xl border border-dashed p-5 text-center transition ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50"
                  : file
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-[#cfd6df] bg-[#fbfcfd] hover:border-emerald-400"
              }`}
            >
              {file ? (
                <div className="flex items-center justify-between gap-3 text-left">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-emerald-600">
                      <Icon name="file" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-sm">
                        ✓ {file.name}
                      </strong>
                      <span className="text-xs text-[#6b7280]">
                        {(file.size / 1024).toFixed(file.size > 1024 ? 0 : 1)}{" "}
                        KB · ready to process
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setInputText("");
                    }}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <span className="mx-auto grid size-10 place-items-center rounded-lg bg-white text-[#6b7280]">
                    <Icon name="upload" />
                  </span>
                  <p className="mt-3 text-sm font-semibold">Upload .txt file</p>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    Drag & drop your file here or browse
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 rounded-lg border border-[#d9dee6] bg-white px-3.5 py-2 text-xs font-semibold transition hover:border-emerald-500 hover:text-emerald-700 cursor-pointer"
                  >
                    Choose File
                  </button>
                  <input
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept=".txt,text/plain"
                    type="file"
                    className="hidden"
                  />
                </>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => handleProcess("encrypt")}
                disabled={!!loadingOperation}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
              >
                <Icon name="lock" className="h-4 w-4" />
                {loadingOperation === "encrypt" ? "Encrypting..." : "Encrypt"}
              </button>
              <button
                onClick={() => handleProcess("decrypt")}
                disabled={!!loadingOperation}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-white text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
              >
                <Icon name="key" className="h-4 w-4" />
                {loadingOperation === "decrypt" ? "Decrypting..." : "Decrypt"}
              </button>
            </div>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="flex gap-2">
              <button
                onClick={handleTryExample}
                className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100 cursor-pointer"
              >
                Try example
              </button>
              <button
                onClick={handleReset}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 cursor-pointer"
              >
                Reset
              </button>
            </div>

            <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
              <label htmlFor="key" className="text-sm font-bold">
                Key <span className="text-red-600">*</span>
              </label>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#6b7280]">
                  <Icon name="key" className="h-4 w-4" />
                </span>
                <input
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  type="text"
                  placeholder="Enter your keyword or key phrase..."
                  className="w-full rounded-xl border border-[#d9dee6] bg-white py-3 pl-10 pr-3 text-sm outline-none transition placeholder:text-[#9ca3af] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-[#6b7280]">
                Used to generate the 5×5 Playfair matrix.
              </p>
            </section>

            <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold">Playfair Matrix</h2>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    I / J are combined
                  </p>
                </div>
                <span className="font-mono text-xs text-emerald-700">5 × 5</span>
              </div>
              {matrix ? (
                <>
                  <div className="mt-5 grid grid-cols-5 gap-1.5">
                    {matrix.flat().map((letter, idx) => (
                      <span
                        key={`${letter}-${idx}`}
                        className="grid aspect-square place-items-center rounded-lg border border-[#e5e7eb] bg-[#fbfcfd] font-mono text-sm font-semibold transition hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        {letter}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-[#eef0f2] pt-3 text-xs leading-5 text-[#6b7280]">
                    <p>
                      <b className="text-[#374151]">Keyword:</b>{" "}
                      {key.trim().slice(0, 22)}
                      {key.trim().length > 22 ? "…" : ""}
                    </p>
                    <p>
                      <b className="text-[#374151]">Alphabet:</b> 25 characters
                    </p>
                  </div>
                </>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-[#d9dee6] bg-[#fbfcfd] p-5 text-center text-xs leading-5 text-[#6b7280]">
                  Enter a key to generate your matrix.
                </div>
              )}
              <p className="mt-4 text-xs leading-5 text-[#6b7280]">
                The matrix is generated automatically from the provided key.
              </p>
            </section>
          </aside>
        </div>

        <section
          ref={resultRef}
          className="mt-8 scroll-mt-24 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03)] sm:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Result</h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                Your transformed text will appear here.
              </p>
            </div>
            {result && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide text-emerald-700">
                {result.operation === "encrypt" ? "ENCRYPTED" : "DECRYPTED"}
              </span>
            )}
          </div>

          {result ? (
            <>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-y border-[#eef0f2] py-3 text-xs text-[#6b7280]">
                <span>
                  File: <b className="text-[#374151]">{result.source}</b>
                </span>
                <span>
                  Operation:{" "}
                  <b className="text-[#374151]">
                    {result.operation === "encrypt" ? "Encryption" : "Decryption"}
                  </b>
                </span>
                <span>
                  Characters:{" "}
                  <b className="text-[#374151]">{result.originalLength}</b>
                </span>
              </div>
              <pre className="mt-5 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4 font-mono text-sm leading-7 text-[#1f2937]">
                {result.result}
              </pre>
              <div className="mt-4 grid gap-2 sm:flex">
                <button
                  onClick={copyResult}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d9dee6] px-3.5 py-2.5 text-sm font-semibold hover:border-emerald-500 hover:text-emerald-700 cursor-pointer"
                >
                  <Icon name="copy" className="h-4 w-4" />
                  {copied ? "✓ Copied" : "Copy"}
                </button>
                <button
                  onClick={downloadResult}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d9dee6] px-3.5 py-2.5 text-sm font-semibold hover:border-emerald-500 hover:text-emerald-700 cursor-pointer"
                >
                  <Icon name="download" className="h-4 w-4" />
                  Download .txt
                </button>
                <button
                  onClick={shareResult}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d9dee6] px-3.5 py-2.5 text-sm font-semibold hover:border-emerald-500 hover:text-emerald-700 cursor-pointer"
                >
                  <Icon name="share" className="h-4 w-4" />
                  Share
                </button>
              </div>
            </>
          ) : (
            <div className="mt-6 grid min-h-40 place-items-center rounded-xl border border-dashed border-[#d9dee6] bg-[#fbfcfd] text-center">
              <div>
                <span className="mx-auto grid size-10 place-items-center rounded-full bg-white text-[#9ca3af]">
                  <Icon name="lock" />
                </span>
                <h3 className="mt-3 text-sm font-bold">No result yet</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Enter your text and key, then choose Encrypt or Decrypt.
                </p>
              </div>
            </div>
          )}
        </section>

        {result && (
          <section className="mt-8 rounded-2xl border border-[#e5e7eb] bg-white p-5 sm:p-7">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                Learn by doing
              </p>
              <h2 className="mt-2 text-lg font-bold">Transformation</h2>
              <p className="mt-2 text-sm text-[#6b7280]">
                Follow one character pair at a time through the key matrix.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-[#e5e7eb] bg-[#fbfcfd] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold text-emerald-700">
                    PAIR {activeStepIndex + 1} OF {result.pairs.length}
                  </p>
                  <div className="mt-2 flex items-center gap-2 font-mono text-2xl font-bold">
                    <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-amber-900">
                      {result.pairs[activeStepIndex]}
                    </span>
                    <Icon name="arrow" className="text-[#9ca3af]" />
                    <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-emerald-800">
                      {result.transformed[activeStepIndex]}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                    disabled={activeStepIndex === 0}
                    className="rounded-lg border border-[#d9dee6] bg-white px-3 py-2 text-sm font-semibold text-[#374151] transition hover:border-emerald-500 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() =>
                      setActiveStepIndex((prev) =>
                        Math.min(result.pairs.length - 1, prev + 1)
                      )
                    }
                    disabled={activeStepIndex === result.pairs.length - 1}
                    className="rounded-lg border border-emerald-600 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              </div>

              <MatrixVisualization
                matrix={result.matrix}
                source={result.pairs[activeStepIndex]}
                output={result.transformed[activeStepIndex]}
              />

              <details className="mt-5 border-t border-[#e5e7eb] pt-4">
                <summary className="cursor-pointer text-sm font-semibold text-[#374151] marker:text-emerald-600">
                  View all {result.pairs.length} transformations
                </summary>
                <div className="mt-4 grid max-h-52 grid-cols-2 gap-2 overflow-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
                  {result.pairs.map((pair, idx) => (
                    <button
                      key={`${pair}-${idx}`}
                      onClick={() => setActiveStepIndex(idx)}
                      className={`rounded-lg border px-3 py-2 text-left font-mono text-xs font-semibold transition cursor-pointer ${
                        activeStepIndex === idx
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-[#e5e7eb] bg-white text-[#4b5563] hover:border-emerald-400"
                      }`}
                    >
                      #{idx + 1} &nbsp;{pair} → {result.transformed[idx]}
                    </button>
                  ))}
                </div>
              </details>
            </div>

            <p className="mt-4 text-xs text-[#6b7280]">
              The selected pair follows the row, column, or rectangle rule shown
              in the matrix.
            </p>
          </section>
        )}
        <section className="mt-8 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03)] sm:p-6" aria-labelledby="course-materials-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="course-materials-title" className="mt-1 text-lg font-bold">Module & Source code</h2>
              <p className="mt-1 text-sm text-[#6b7280]">Learn the basics of classical cryptography and view the C++ implementation.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/02%20Kriptografi%20Klasik%202023.pdf" target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700">Open PDF Module ↗</a>
              <a href="/playfair_rawcode.cpp" target="_blank" rel="noreferrer" className="rounded-lg border border-[#d9dee6] bg-white px-3.5 py-2.5 text-xs font-bold text-[#374151] transition hover:border-emerald-500 hover:text-emerald-700">View C++ Source ↗</a>
            </div>
          </div>
        </section>
      </main>

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-xl bg-[#111827] px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          {toastMessage}
        </div>
      )}

      {isAboutOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-title"
          className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[#111827]/30 p-5"
          onClick={() => setIsAboutOpen(false)}
        >
          <div
            className="max-h-[calc(100dvh-2.5rem)] w-full max-w-2xl overscroll-contain overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-7"
            style={{ scrollbarGutter: "stable" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                  Credits
                </p>
                <h2 id="about-title" className="mt-2 text-xl font-bold">
                  Playfair Cipher Workshop
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close about dialog"
                onClick={() => setIsAboutOpen(false)}
                className="rounded-lg p-2 text-[#6b7280] hover:bg-gray-100 cursor-pointer"
              >
                <Icon name="close" />
              </button>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#6b7280]">
              Tugas Mata Kuliah Keamanan Informasi, Kelompok 4, IPB University. 
              Workshop ini dibuat untuk mempelajari cara kerja enkripsi klasik 
              Playfair Cipher, termasuk proses enkripsi dan dekripsi teks menggunakan kunci tertentu
            </p>
            <div className="mt-6">
              <h3 className="text-sm font-bold text-[#111827]">Team credits</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  ["M0403241091", "Muhammad Irfan Daniswara"],
                  ["M0403241121", "Nabil Musannif Siregar"],
                  ["M0403241054", "ANNISA AZZAHRA KUSMAWAN"],
                  ["M0403241105", "Mochamad Aleandre Moulidouane", "Programmer"],
                  ["M0403241097", "Ferdy Alfalah"],
                  ["M0403241164", "Nailah Adianti Hermawan"],
                  ["M0403241013", "Muhammad Wafi Robbani"],
                  ["M0403241006", "Candra Agung Alief Prasetyo", "UI/UX Designer"],
                  ["M0403241026", "Taufiq Sadri", "Programmer"],
                  ["M0403241122", "Muhammad Rezonaldo Yunus"],
                ].map(([id, name, role]) => (
                  <div key={id} className="rounded-lg border border-[#eef0f2] bg-[#fbfcfd] px-3 py-2.5">
                    <p className="font-mono text-[10px] text-[#6b7280]">{id}</p>
                    <p className="mt-1 text-sm font-semibold text-[#374151]">{name}</p>
                    {role && <p className="mt-0.5 text-xs font-medium text-emerald-700">{role}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
