import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  validateIntegerLexical,
  canonicalRational,
  validateRational,
  decimalExactSemanticValue,
  validateApproximateNumber,
  canonicalizeNativeMathObject,
  validateNativeMathObject,
} from '../src/index.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(here, 'fixtures', name), 'utf8'))
const clone = (value) => structuredClone(value)

test('exact integer validation is lexical and host-width independent', () => {
  assert.deepEqual(validateIntegerLexical('123456789012345678901234567890'), { status: 'valid', value: '123456789012345678901234567890' })
  assert.equal(validateIntegerLexical('01').status, 'reject')
  assert.equal(validateIntegerLexical('+1').status, 'reject')
})

test('rational canonicality uses arbitrary precision reduction and positive denominator', () => {
  assert.deepEqual(canonicalRational('2', '6'), { numerator: '1', denominator: '3' })
  assert.deepEqual(canonicalRational('-2', '-6'), { numerator: '1', denominator: '3' })
  assert.deepEqual(canonicalRational('0', '999'), { numerator: '0', denominator: '1' })
  assert.deepEqual(validateRational({ numerator: '1', denominator: '3' }), { status: 'valid', canonical: true })
  assert.deepEqual(validateRational({ numerator: '2', denominator: '6' }), {
    status: 'reject-noncanonical', canonical_form: { numerator: '1', denominator: '3' },
  })
  assert.equal(validateRational({ numerator: '1', denominator: '0' }).status, 'reject')
})

test('exact decimal semantic value is rendered without binary floating point', () => {
  assert.equal(decimalExactSemanticValue('123', '-2'), '1.23')
  assert.equal(decimalExactSemanticValue('-123', '4'), '-1230000')
  assert.equal(decimalExactSemanticValue('1', '-5'), '0.00001')
  assert.equal(decimalExactSemanticValue('0', '-999999999999999999'), '0')
})

test('approximate number requires explicit approximation metadata', () => {
  assert.deepEqual(validateApproximateNumber({
    format: 'decimal', value: '0.333333', precision: { kind: 'absolute-error', value: '0.000001' },
  }), { status: 'valid', exact: false })
  assert.equal(validateApproximateNumber({ format: 'decimal', value: '0.3' }).status, 'reject')
  assert.equal(validateApproximateNumber({ format: 'decimal', value: '0.3', precision: { kind: 'unknown-error', value: null } }).status, 'valid')
})

test('frozen integral example passes candidate semantic validation', () => {
  const result = validateNativeMathObject(fixture('native_math_integral_example.json'))
  assert.equal(result.ok, true, JSON.stringify(result.errors))
})

test('candidate canonicalization sorts structural records but preserves semantic edge order and Unicode', () => {
  const input = fixture('native_math_integral_example.json')
  input.expression.nodes.reverse()
  input.environment.declarations = [
    { declaration_id: 'd-z', display_name: 'e\u0301', type: null },
    { declaration_id: 'd-a', display_name: 'é', type: null },
  ]
  const pow = input.expression.nodes.find((n) => n.id === 'n-pow')
  const args = [...pow.args]
  const output = canonicalizeNativeMathObject(input)
  assert.deepEqual(output.expression.nodes.map((n) => n.id), [...output.expression.nodes.map((n) => n.id)].sort())
  assert.deepEqual(output.environment.declarations.map((d) => d.declaration_id), ['d-a', 'd-z'])
  assert.deepEqual(output.expression.nodes.find((n) => n.id === 'n-pow').args, args)
  assert.equal(output.environment.declarations[1].display_name, 'e\u0301')
})

test('semantic validator rejects missing refs, unreachable nodes, cycles, free/bound identity errors, and noncanonical rational', () => {
  const base = fixture('native_math_integral_example.json')

  const missing = clone(base)
  missing.expression.nodes.find((n) => n.id === 'n-pow').args[0] = 'missing'
  assert.ok(validateNativeMathObject(missing).errors.some((e) => e.code === 'MissingNodeReference'))

  const unreachable = clone(base)
  unreachable.expression.nodes.push({ id: 'n-unused', kind: 'integer', value: '9' })
  unreachable.expression.nodes.sort((a, b) => a.id.localeCompare(b.id))
  assert.ok(validateNativeMathObject(unreachable).errors.some((e) => e.code === 'UnreachableNode'))

  const cycle = clone(base)
  cycle.expression.nodes.find((n) => n.id === 'n-pow').args[0] = 'n-int'
  assert.ok(validateNativeMathObject(cycle).errors.some((e) => e.code === 'ExpressionCycle'))

  const free = clone(base)
  free.expression.nodes.find((n) => n.id === 'n-x').kind = 'free-ref'
  delete free.expression.nodes.find((n) => n.id === 'n-x').binding_id
  free.expression.nodes.find((n) => n.id === 'n-x').declaration_id = 'd-missing'
  assert.ok(validateNativeMathObject(free).errors.some((e) => e.code === 'UnknownDeclaration'))

  const bound = clone(base)
  bound.expression.root = 'n-x'
  assert.ok(validateNativeMathObject(bound).errors.some((e) => e.code === 'BoundRefOutOfScope'))

  const rational = clone(base)
  rational.expression.nodes.push({ id: 'n-rat', kind: 'rational', numerator: '2', denominator: '6' })
  rational.expression.nodes.sort((a, b) => a.id.localeCompare(b.id))
  // Make the rational reachable as a lower limit while preserving the rest of the graph.
  rational.expression.nodes.find((n) => n.id === 'n-int').limits.lower = 'n-rat'
  assert.ok(validateNativeMathObject(rational).errors.some((e) => e.code === 'NonCanonicalRational'))
})

test('proved evidence without certificate is rejected before mutation authority', () => {
  const input = fixture('native_math_integral_example.json')
  input.evidence[0].class = 'proved'
  input.evidence[0].certificate_ref = null
  const result = validateNativeMathObject(input)
  assert.ok(result.errors.some((e) => e.code === 'ProofCertificateRequired'))
})
