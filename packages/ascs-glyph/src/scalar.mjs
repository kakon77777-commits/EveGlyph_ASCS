export const GLYPH_SCALAR_RE = /^(0|-?[1-9][0-9]*|-?(0|[1-9][0-9]*)\.[0-9]*[1-9])$/

export function validGlyphScalar(value) {
  return typeof value === 'string' && value !== '-0' && GLYPH_SCALAR_RE.test(value)
}

function scalarFraction(value) {
  if (!validGlyphScalar(value)) throw new TypeError(`invalid glyph scalar: ${String(value)}`)
  const negative = value.startsWith('-')
  const unsigned = negative ? value.slice(1) : value
  if (!unsigned.includes('.')) return { n: BigInt(value), d: 1n }
  const [whole, frac] = unsigned.split('.')
  const d = 10n ** BigInt(frac.length)
  const n = BigInt(whole) * d + BigInt(frac)
  return { n: negative ? -n : n, d }
}

export function compareGlyphScalars(a, b) {
  const aa = scalarFraction(a)
  const bb = scalarFraction(b)
  const lhs = aa.n * bb.d
  const rhs = bb.n * aa.d
  return lhs < rhs ? -1 : lhs > rhs ? 1 : 0
}
