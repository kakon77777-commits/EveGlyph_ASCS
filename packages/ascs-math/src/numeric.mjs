const INT_RE = /^-?(0|[1-9][0-9]*)$/
const APPROX_FORMATS = new Set(['decimal', 'binary32', 'binary64', 'arbitrary', 'backend-native'])
const PRECISION_KINDS = new Set(['absolute-error', 'relative-error', 'digits', 'unknown-error'])

export function validateIntegerLexical(value) {
  if (typeof value !== 'string' || !INT_RE.test(value)) return { status: 'reject' }
  return { status: 'valid', value }
}

function absBigInt(value) { return value < 0n ? -value : value }
function gcd(a, b) {
  a = absBigInt(a); b = absBigInt(b)
  while (b !== 0n) [a, b] = [b, a % b]
  return a
}

export function canonicalRational(numerator, denominator) {
  if (validateIntegerLexical(numerator).status !== 'valid' || validateIntegerLexical(denominator).status !== 'valid') {
    throw new TypeError('rational numerator and denominator must be signed integer strings')
  }
  let p = BigInt(numerator)
  let q = BigInt(denominator)
  if (q === 0n) throw new RangeError('rational denominator must not be zero')
  if (q < 0n) { p = -p; q = -q }
  if (p === 0n) return { numerator: '0', denominator: '1' }
  const d = gcd(p, q)
  return { numerator: (p / d).toString(), denominator: (q / d).toString() }
}

export function validateRational(input) {
  if (!input || validateIntegerLexical(input.numerator).status !== 'valid' || validateIntegerLexical(input.denominator).status !== 'valid') {
    return { status: 'reject' }
  }
  let canonical
  try { canonical = canonicalRational(input.numerator, input.denominator) }
  catch { return { status: 'reject' } }
  if (canonical.numerator === input.numerator && canonical.denominator === input.denominator) {
    return { status: 'valid', canonical: true }
  }
  return { status: 'reject-noncanonical', canonical_form: canonical }
}

export function canonicalExactDecimal(coefficient, exponent10) {
  if (validateIntegerLexical(coefficient).status !== 'valid' || validateIntegerLexical(exponent10).status !== 'valid') {
    throw new TypeError('exact decimal coefficient/exponent10 must be signed integer strings')
  }
  let c = BigInt(coefficient)
  let e = BigInt(exponent10)
  if (c === 0n) return { coefficient: '0', exponent10: '0' }
  while (c % 10n === 0n) { c /= 10n; e += 1n }
  return { coefficient: c.toString(), exponent10: e.toString() }
}

export function decimalExactSemanticValue(coefficient, exponent10) {
  const canonical = canonicalExactDecimal(coefficient, exponent10)
  let c = BigInt(canonical.coefficient)
  let e = BigInt(canonical.exponent10)
  if (c === 0n) return '0'
  const negative = c < 0n
  if (negative) c = -c
  const digits = c.toString()
  const MAX_RENDER_EXP = 1_000_000n
  if (e > MAX_RENDER_EXP || e < -MAX_RENDER_EXP) throw new RangeError('exact decimal rendering exceeds bounded projection size')
  const n = Number(e)
  let out
  if (n >= 0) out = digits + '0'.repeat(n)
  else {
    const split = digits.length + n
    out = split > 0 ? `${digits.slice(0, split)}.${digits.slice(split)}` : `0.${'0'.repeat(-split)}${digits}`
  }
  return negative ? `-${out}` : out
}

export function validateApproximateNumber(input) {
  if (!input || !APPROX_FORMATS.has(input.format) || typeof input.value !== 'string' || input.value.length === 0) {
    return { status: 'reject' }
  }
  const precision = input.precision
  if (!precision || !PRECISION_KINDS.has(precision.kind) || !Object.hasOwn(precision, 'value')) return { status: 'reject' }
  if (precision.kind === 'unknown-error') {
    if (precision.value !== null && typeof precision.value !== 'string') return { status: 'reject' }
  } else if (typeof precision.value !== 'string' || precision.value.length === 0) return { status: 'reject' }
  return { status: 'valid', exact: false }
}
