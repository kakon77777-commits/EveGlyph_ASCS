import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  validateMathSubaddress,
  createNodeMapEntry,
  validateTransformRecord,
  validateAdapterFidelity,
  executeMathConformanceVector,
} from '../src/index.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(here, 'fixtures', name), 'utf8'))
const vectors = fixture('native_math_conformance_vectors.json').vectors
const byId = new Map(vectors.map((v) => [v.id, v]))

test('math subaddress is revision-local', () => {
  assert.deepEqual(validateMathSubaddress({ revision: 'rev:v1', node: 'n3' }, 'rev:v2'), {
    direct_reuse_allowed: false, mapping_required: true,
  })
  assert.deepEqual(validateMathSubaddress({ revision: 'rev:v2', node: 'n3' }, 'rev:v2'), {
    direct_reuse_allowed: true, mapping_required: false,
  })
})

test('node map uses the frozen status vocabulary', () => {
  for (const status of ['mapped', 'split', 'merged', 'deleted', 'ambiguous', 'unmapped']) {
    assert.equal(createNodeMapEntry({ from: 'n1', status, to: status === 'deleted' ? [] : ['n2'] }).status, status)
  }
  assert.throws(() => createNodeMapEntry({ from: 'n1', status: 'renamed', to: ['n2'] }))
})

test('frozen transform and fidelity examples validate', () => {
  assert.equal(validateTransformRecord(fixture('math_transform_example.json')).ok, true)
  assert.equal(validateAdapterFidelity(fixture('math_adapter_fidelity_example.json')).ok, true)
})

test('MATH-024 and MATH-025 execute via production transform functions', () => {
  for (const id of ['MATH-024', 'MATH-025']) {
    const v = byId.get(id)
    assert.deepEqual(executeMathConformanceVector(v), v.expected, id)
  }
})
