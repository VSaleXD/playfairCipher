export const ALPHABET = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

/**
 * Generates a 5x5 Playfair matrix from a keyword.
 * - Converts J to I
 * - Removes non-alphabetic characters
 * - Deduplicates characters
 * - Fills the remainder with the 25-letter alphabet
 */
export function generateMatrix(key) {
  const cleaned = key
    .toUpperCase()
    .replace(/J/g, "I")
    .replace(/[^A-Z]/g, "");
  const chars = Array.from(new Set(`${cleaned}${ALPHABET}`)).slice(0, 25);
  return Array.from({ length: 5 }, (_, i) => chars.slice(i * 5, i * 5 + 5));
}

/**
 * Prepares text into digraph pairs according to standard Playfair rules:
 * - Replaces J with I
 * - Strips non-letters
 * - If double letter occurs in a pair, inserts 'X' (e.g. TREE -> TR, EX, E...)
 * - If text length is odd, appends 'X'
 */
export function preparePairs(text) {
  const cleaned = text
    .toUpperCase()
    .replace(/J/g, "I")
    .replace(/[^A-Z]/g, "");
  const pairs = [];
  let i = 0;
  while (i < cleaned.length) {
    const a = cleaned[i];
    const b = cleaned[i + 1];
    if (!b || a === b) {
      pairs.push(`${a}X`);
      i += 1;
    } else {
      pairs.push(`${a}${b}`);
      i += 2;
    }
  }
  return pairs;
}

/**
 * Finds the (row, column) coordinates of a character in the 5x5 matrix.
 */
export function findPosition(matrix, char) {
  for (let row = 0; row < 5; row += 1) {
    const column = matrix[row].indexOf(char);
    if (column !== -1) {
      return { row, column };
    }
  }
  throw new Error(`Character ${char} not found in matrix`);
}

/**
 * Transforms a single digraph pair according to the 3 Playfair rules:
 * 1. Same row: shift right (encrypt) or left (decrypt)
 * 2. Same column: shift down (encrypt) or up (decrypt)
 * 3. Rectangle: swap column indices
 */
export function transformPair(pair, matrix, operation) {
  const [firstChar, secondChar] = pair.split("");
  const posA = findPosition(matrix, firstChar);
  const posB = findPosition(matrix, secondChar);
  const shift = operation === "encrypt" ? 1 : -1;

  // Same row rule
  if (posA.row === posB.row) {
    return (
      matrix[posA.row][(posA.column + shift + 5) % 5] +
      matrix[posB.row][(posB.column + shift + 5) % 5]
    );
  }

  // Same column rule
  if (posA.column === posB.column) {
    return (
      matrix[(posA.row + shift + 5) % 5][posA.column] +
      matrix[(posB.row + shift + 5) % 5][posB.column]
    );
  }

  // Rectangle rule
  return matrix[posA.row][posB.column] + matrix[posB.row][posA.column];
}

/**
 * Processes full text encryption or decryption using the Playfair cipher.
 */
export function processPlayfair(text, key, operation) {
  const matrix = generateMatrix(key);
  const pairs = preparePairs(text);
  const transformed = pairs.map((pair) => transformPair(pair, matrix, operation));
  return {
    matrix,
    pairs,
    transformed,
    result: transformed.join(""),
  };
}
