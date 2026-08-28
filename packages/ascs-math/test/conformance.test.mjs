import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { executeMathConformanceVector } from '../src/index.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const corpus = JSON.parse(fs.readFileSync(path.join(here, 'fixtures', 'native_math_conformance_vectors.json'), 'utf8'))

test('all 30 frozen v0.5 Native Math vectors execute through generic production semantics', () => {
  assert.equal(corpus.profile, 'org.evemisslab.math-conformance-vectors/0.1')
  assert.equal(corpus.vectors.length, 30)
  assert.equal(new Set(corpus.vectors.map((v) => v.id)).size, 30)
  for (const vector of corpus.vectors) {
    assert.deepEqual(executeMathConformanceVector(vector), vector.expected, vector.id)
  }
})
