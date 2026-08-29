import test from 'node:test'
import assert from 'node:assert/strict'
import { referenceJson } from './reference-helper.mjs'
import { runE1AgentConformance } from '../src/index.mjs'

test('E1 conformance executes exactly 17 production scenarios and defers 19 later-slice vectors', async () => {
  const result = await runE1AgentConformance()
  assert.equal(result.total, 36)
  assert.equal(result.passed, 17)
  assert.equal(result.deferred, 19)
  assert.equal(result.failed, 0)
  assert.equal(result.results.length, 36)
  assert.deepEqual(
    result.results.map(row => row.vector_id).sort(),
    Array.from({ length: 36 }, (_, i) => `AG-${String(i + 1).padStart(2, '0')}`),
  )

  const covered = result.results.filter(row => row.status === 'PASS')
  const deferred = result.results.filter(row => row.status === 'DEFERRED')
  assert.equal(covered.length, 17)
  assert.equal(deferred.length, 19)
  for (const row of covered) assert.equal(typeof row.observed, 'object')
  for (const row of deferred) assert.match(row.slice, /^E[2346]$/)
})

test('covered scenarios do not obtain PASS by echoing frozen expected text', async () => {
  const vectors = referenceJson('conformance/agent_conformance_vectors.json').vectors
  const expected = new Map(vectors.map(vector => [vector.id, vector.expected]))
  const result = await runE1AgentConformance()
  for (const row of result.results.filter(item => item.status === 'PASS')) {
    assert.notEqual(row.observed, expected.get(row.vector_id))
    assert.equal(Object.hasOwn(row, 'expected'), false)
  }
})

test('coverage manifest and runtime dispatcher classify every vector exactly once', async () => {
  const coverage = referenceJson('E1_VECTOR_COVERAGE.json')
  const runtime = await runE1AgentConformance()
  const covered = new Set(coverage.covered)
  const deferred = new Map(coverage.deferred.map(row => [row.id, row.slice]))
  for (const row of runtime.results) {
    if (row.status === 'PASS') assert.equal(covered.has(row.vector_id), true)
    if (row.status === 'DEFERRED') assert.equal(deferred.get(row.vector_id), row.slice)
  }
})
