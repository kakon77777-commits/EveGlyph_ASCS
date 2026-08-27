import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  canonicalBytes,
  sha256Hex,
  contentAddress,
  revisionAddress,
  workspaceRevisionAddress,
} from '../src/index.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const fixture = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', 'minimal_workspace.egir.json'), 'utf8'))
const vectors = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', 'tw01_vectors.json'), 'utf8'))

test('TW-01 canonical UTF-8 vector is exact', async () => {
  const bytes = canonicalBytes(vectors.canonicalization.input)
  assert.equal(new TextDecoder().decode(bytes), vectors.canonicalization.canonical_utf8)
  assert.equal(await sha256Hex(bytes), vectors.canonicalization.sha256)
})

test('TW-01 minimal object/revision/workspace addresses recompute exactly', async () => {
  const math = fixture.revision_records.find((r) => r.kind === 'math')
  const relation = fixture.revision_records.find((r) => r.kind === 'relation')

  assert.equal(await contentAddress(math.kind, math.intrinsic), vectors.example_expectations.math_content_address)
  assert.equal(await revisionAddress(math), vectors.example_expectations.math_revision_id)
  assert.equal(await contentAddress(relation.kind, relation.intrinsic), vectors.example_expectations.relation_content_address)
  assert.equal(await revisionAddress(relation), vectors.example_expectations.relation_revision_id)
  assert.equal(await workspaceRevisionAddress(fixture.workspace), vectors.example_expectations.workspace_revision)
})

test('EGIR-CJ rejects floating point and unsafe structural integers', () => {
  assert.throws(() => canonicalBytes({ n: 1.25 }), /float|integer/i)
  assert.throws(() => canonicalBytes({ n: Number.MAX_SAFE_INTEGER + 1 }), /unsafe|integer/i)
})

test('EGIR-CJ preserves Unicode scalar sequence without normalization', () => {
  const composed = new TextDecoder().decode(canonicalBytes({ s: 'é' }))
  const decomposed = new TextDecoder().decode(canonicalBytes({ s: 'e\u0301' }))
  assert.notEqual(composed, decomposed)
  assert.equal(composed, '{"s":"é"}')
  assert.equal(decomposed, '{"s":"é"}')
})
