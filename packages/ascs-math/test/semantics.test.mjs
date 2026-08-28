import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  alphaEquivalent,
  captureAvoidingSubstitute,
  validateEvidenceRecord,
  validateEqualityVerdict,
  executeMathConformanceVector,
} from '../src/index.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const vectors = JSON.parse(fs.readFileSync(path.join(here, 'fixtures', 'native_math_conformance_vectors.json'), 'utf8')).vectors
const byId = new Map(vectors.map((v) => [v.id, v]))

test('alpha equivalence ignores binder display names but not free/bound identity', () => {
  assert.equal(alphaEquivalent('lambda x. x', 'lambda y. y'), true)
  assert.equal(alphaEquivalent('free:x', 'bound:x'), false)
})

test('capture-avoiding substitution keeps substituted free y free', () => {
  const result = captureAvoidingSubstitute('lambda y. x', { x: 'y' })
  assert.equal(result.capture_avoiding, true)
  assert.equal(result.free_substitution_preserved, true)
  assert.notEqual(result.expression, 'lambda y. y')
})

test('computed evidence is not proof and proof needs certificate', () => {
  assert.deepEqual(validateEvidenceRecord({ class: 'computed', producer: { kind: 'cas' }, certificate_ref: null }), {
    status: 'valid', evidence_class: 'computed', proved: false,
  })
  assert.deepEqual(validateEvidenceRecord({ class: 'proved', producer: { kind: 'prover' }, certificate_ref: null }), {
    status: 'reject', reason: 'proof-or-certificate-required',
  })
})

test('equality verdict requires explicit equality class', () => {
  assert.deepEqual(validateEqualityVerdict({ equal: true, equality_class: null }), {
    status: 'reject', reason: 'equality-class-required',
  })
})

test('MATH-001..023 and MATH-030 execute via production semantics', () => {
  const ids = [...Array.from({ length: 23 }, (_, i) => `MATH-${String(i + 1).padStart(3, '0')}`), 'MATH-030']
  for (const id of ids) {
    const vector = byId.get(id)
    assert.ok(vector, id)
    assert.deepEqual(executeMathConformanceVector(vector), vector.expected, id)
  }
})
