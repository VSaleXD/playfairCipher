import { useRef, useState } from 'react'
import './App.css'

const ALPHABET = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'

function cleanLetters(value) {
  return value.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '')
}

function makeGrid(keyword) {
  return [...new Set([...cleanLetters(keyword), ...ALPHABET])].slice(0, 25)
}

function makePairs(value, decrypt = false) {
  const letters = cleanLetters(value)
  if (decrypt) return Array.from({ length: Math.floor(letters.length / 2) }, (_, index) => letters.slice(index * 2, index * 2 + 2))

  const pairs = []
  let index = 0
  while (index < letters.length) {
    const first = letters[index]
    const second = letters[index + 1]
    if (!second) {
      pairs.push([first, first === 'X' ? 'Q' : 'X'])
      index += 1
    } else if (first === second) {
      pairs.push([first, first === 'X' ? 'Q' : 'X'])
      index += 1
    } else {
      pairs.push([first, second])
      index += 2
    }
  }
  return pairs
}

function transform(value, grid, direction, decrypt = false) {
  const positions = new Map(grid.map((letter, index) => [letter, [Math.floor(index / 5), index % 5]]))
  return makePairs(value, decrypt).map(([first, second]) => {
    const firstPosition = positions.get(first)
    const secondPosition = positions.get(second)
    if (!firstPosition || !secondPosition) return ''
    if (firstPosition[0] === secondPosition[0]) {
      return [firstPosition, secondPosition].map(([row, column]) => grid[row * 5 + (column + direction + 5) % 5]).join('')
    }
    if (firstPosition[1] === secondPosition[1]) {
      return [firstPosition, secondPosition].map(([row, column]) => grid[((row + direction + 5) % 5) * 5 + column]).join('')
    }
    return grid[firstPosition[0] * 5 + secondPosition[1]] + grid[secondPosition[0] * 5 + firstPosition[1]]
  }).join('')
}

function App() {
  const [key, setKey] = useState('MONARCHY')
  const [grid, setGrid] = useState(() => makeGrid('MONARCHY'))
  const [message, setMessage] = useState('INSTRUMEN RAHASIA')
  const [cipherText, setCipherText] = useState('')
  const [plainText, setPlainText] = useState('')
  const [notice, setNotice] = useState('')
  const fileInput = useRef(null)

  //Fungsi belum ada untuk matriks
  const updateKey = (value) => {

  }

  const updateCell = (index, value) => {

  }

  const encrypt = () => {
    if (!cleanLetters(message)) return setNotice('Masukkan pesan terlebih dahulu.')
    const result = transform(message, grid, 1)
    setCipherText(result)
    setNotice('Pesan berhasil dienkripsi.')
  }

  const decrypt = () => {
    const source = cipherText || message
    if (!cleanLetters(source)) return setNotice('Masukkan ciphertext terlebih dahulu.')
    const result = transform(source, grid, -1, true).replace(/X(?=[A-Z])|Q(?=X$)/g, '').replace(/[XQ]$/, '')
    setPlainText(result)
    setNotice('Ciphertext berhasil didekripsi.')
  }

  const readFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setMessage(String(reader.result || ''))
      setNotice(`Berkas ${file.name} berhasil dimuat.`)
    }
    reader.readAsText(file)
  }

  return (
    <div className="page">
      <header className="site-header"><h1> Playfair Cipher</h1><p>Kelompok 4 Keamanan Informasi</p></header>
      <main className="container">
        <section className="form-container">
          <div className="form-group"><label htmlFor="key">Key word:</label><input id="key" type="text" value={key} onChange={(event) => updateKey(event.target.value)} placeholder="Enter key" /></div>
          <div className="form-group"><label htmlFor="message">Message:</label><textarea id="message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Enter a message" /><div className="file-row"><button className="file-button" type="button" onClick={() => fileInput.current?.click()}>Upload .txt</button><input ref={fileInput} type="file" accept=".txt,text/plain" onChange={readFile} hidden /><small>J otomatis menjadi I</small></div></div>
          <div className="matrix-section"><div className="matrix-title"><label>Playfair matrix:</label><button type="button" onClick={() => updateKey(key)}>Reset</button></div><div className="matrix">{grid.map((letter, index) => <input key={index} value={letter} maxLength={1} onChange={(event) => updateCell(index, event.target.value)} aria-label={`Matrix cell ${index + 1}`} />)}</div></div>
          <div className="button-row"><button className="btn btn-primary" type="button" onClick={encrypt}>Encrypt</button><button className="btn btn-success" type="button" onClick={decrypt}>Decrypt</button></div>
          {notice && <p className="notice">{notice}</p>}
        </section>
        <section className="result-container"><div className="result"><h3>Cipher Text:</h3><textarea value={cipherText} onChange={(event) => setCipherText(event.target.value)} className="result-text" placeholder="Cipher text will appear here" /></div><div className="result"><h3>PlainText:</h3><textarea value={plainText} readOnly className="result-text" placeholder="Plain text will appear here" /></div></section>
      </main>
      <footer><p>Dibuat oleh Tim IPB University</p></footer>
    </div>
  )
}

export default App
