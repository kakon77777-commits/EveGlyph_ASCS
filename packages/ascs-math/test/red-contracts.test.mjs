import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  validateNativeMathObject,
  executeMathConformanceVector,
  projectNativeMathToLatex,
  projectNativeMathToMathML,
} from '../src/index.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(here, 'fixtures', name), 'utf8'))

test('frozen v0.5 Native Math fixture set is exactly 30 unique vectors', () => {
  const vectors = fixture('native_math_conformance_vectors.json')
  assert.equal(vectors.profile, 'org.evemisslab.math-conformance-vectors/0.1')
  assert.equal(vectors.vectors.length, 30)
  assert.equal(new Set(vectors.vectors.map((item) => item.id)).size, 30)
})

test('Native Math public APIs validate, execute vectors, and project without source authority', () => {
  const example = fixture('native_math_integral_example.json')
  assert.equal(validateNativeMathObject(example).ok, true)
  const vector = fixture('native_math_conformance_vectors.json').vectors[0]
  assert.deepEqual(executeMathConformanceVector(vector), vector.expected)
  assert.equal(typeof projectNativeMathToLatex(example).source, 'string')
  assert.equal(typeof projectNativeMathToMathML(example).source, 'string')
})
