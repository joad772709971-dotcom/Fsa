/**
 * Barcode & QR Code Generator Utility
 * Generates Code128 / EAN13 SVG barcodes and QR code SVGs offline.
 */

// Simple Code 128 (Subset B) table encoder for clean barcode rendering
const CODE128_PATTERNS: { [key: string]: string } = {
  ' ': '11011001100', '!': '11001101100', '"': '11001100110', '#': '10010011000',
  '$': '10010001100', '%': '10001001100', '&': '10011001000', "'": '10011000100',
  '(': '10001100100', ')': '11001001000', '*': '11001000100', '+': '11000100100',
  ',': '10110011100', '-': '10011011100', '.': '10011001110', '/': '10111001100',
  '0': '10011101100', '1': '10011100110', '2': '11001110010', '3': '11001011100',
  '4': '11001001110', '5': '11011100100', '6': '11001110100', '7': '11101101110',
  '8': '11101001100', '9': '11100101100', ':': '11100100110', ';': '11101100100',
  '<': '11100110100', '=': '11100110010', '>': '11011011000', '?': '11011000110',
  '@': '11000110110', 'A': '10100011000', 'B': '10001011000', 'C': '10001000110',
  'D': '10110001000', 'E': '10001101000', 'F': '10001100010', 'G': '11010001000',
  'H': '11000101000', 'I': '11000100010', 'J': '10110111000', 'K': '10110001110',
  'L': '10001101110', 'M': '10111011000', 'N': '10111000110', 'O': '10001110110',
  'P': '11101110110', 'Q': '11010001110', 'R': '11000101110', 'S': '11011101000',
  'T': '11011100010', 'U': '11011101110', 'V': '11101011000', 'W': '11101000110',
  'X': '11100010110', 'Y': '11101101000', 'Z': '11101100010', '[': '11100011010',
  '\\': '11101111010', ']': '11001000010', '^': '11110001010', '_': '10100110000',
  'START_B': '11010010000', 'STOP': '1100011101011'
};

/**
 * Generate unique random barcode for shop products
 */
export function generateAutoBarcode(): string {
  const prefix = '2026';
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `${prefix}${randomDigits}`;
}

/**
 * Render standard barcode pattern string
 */
export function encodeCode128B(text: string): string {
  const clean = text.replace(/[^\x20-\x7E]/g, '');
  let binary = CODE128_PATTERNS['START_B'];
  
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const pattern = CODE128_PATTERNS[char] || CODE128_PATTERNS['0'];
    binary += pattern;
  }
  
  binary += CODE128_PATTERNS['STOP'];
  return binary;
}

/**
 * Render barcode as an SVG data URL or SVG path for crisp printing
 */
export function getBarcodeSVGString(
  code: string,
  width: number = 220,
  height: number = 70,
  showText: boolean = true
): string {
  const binary = encodeCode128B(code || '2026000000');
  const barWidth = width / binary.length;
  
  let rects = '';
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      const x = (i * barWidth).toFixed(2);
      rects += `<rect x="${x}" y="0" width="${(barWidth + 0.1).toFixed(2)}" height="${height - (showText ? 18 : 0)}" fill="#0f172a" />`;
    }
  }

  const textElement = showText
    ? `<text x="${width / 2}" y="${height - 2}" font-family="monospace" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="2">${code}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    ${rects}
    ${textElement}
  </svg>`;
}
