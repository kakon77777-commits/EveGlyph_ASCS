import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { classifyHistoryVector } from '../src/index.mjs'

test('all 12 frozen v0.3 history conformance vectors execute through generic semantics', async () => {
  const frozen = JSON.parse(await readFile(new URL('./fixtures/history_merge_vectors.json', import.meta.url), 'utf8'))
  assert.equal(frozen.vectors.length, 12)
  for (const vector of frozen.vectors) {
    assert.deepEqual(classifyHistoryVector(vector), vector.expected, vector.id)
  }
})
