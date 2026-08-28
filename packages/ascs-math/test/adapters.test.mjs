import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  projectNativeMathToLatex,
  projectNativeMathToMathML,
  classifyLatexImportCandidate,
  classifyMathMLImportCandidate,
  executeMathConformanceVector,
} from '../src/index.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(here, 'fixtures', name), 'utf8'))
const vectors = fixture('native_math_conformance_vectors.json').vectors
const byId = new Map(vectors.map((v) => [v.id, v]))

test('Native Math integral projects deterministically to LaTeX without becoming source authority', () => {
  const result = projectNativeMathToLatex(fixture('native_math_integral_example.json'))
  assert.match(result.source, /\\int/)
  assert.match(result.source, /\^\{2\}/)
  assert.equal(result.authority, 'projection-only')
  assert.equal(result.fidelity.semantics, 'preserved-subset')
  assert.equal(result.fidelity.binding, 'preserved-subset')
})

test('Native Math integral projects to MathML with explicit semantic fidelity', () => {
  const result = projectNativeMathToMathML(fixture('native_math_integral_example.json'))
  assert.match(result.source, /^<math/)
  assert.match(result.source, /∫|&#x222B;/)
  assert.equal(result.authority, 'projection-only')
  assert.notEqual(result.fidelity.semantics, 'exact')
})

test('LaTeX and presentation MathML imports remain candidate-only', () => {
  const latex = classifyLatexImportCandidate('custom macro expression')
  assert.equal(latex.authority, 'candidate-only')
  assert.equal(latex.fidelity.semantic_exactness_assumed, false)
  const mathml = classifyMathMLImportCandidate('presentation-mathml')
  assert.equal(mathml.authority, 'candidate-only')
  assert.equal(mathml.fidelity.full_semantics_assumed, false)
})

test('MATH-026..029 execute via production adapter boundary functions', () => {
  for (const id of ['MATH-026', 'MATH-027', 'MATH-028', 'MATH-029']) {
    const v = byId.get(id)
    assert.deepEqual(executeMathConformanceVector(v), v.expected, id)
  }
})
