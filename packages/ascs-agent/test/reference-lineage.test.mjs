import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PKG = path.resolve(HERE, '..')
const REPO = path.resolve(PKG, '../..')

test('E1 package declares frozen v0.7 implementation-reference lineage', () => {
  const lineagePath = path.join(REPO, 'packages', 'MILESTONE_E1_AGENT_REFERENCE_LINEAGE.json')
  assert.equal(fs.existsSync(lineagePath), true, 'E1 lineage manifest is missing')
  const lineage = JSON.parse(fs.readFileSync(lineagePath, 'utf8'))
  assert.equal(lineage.authority, 'implementation-reference-only')
  assert.equal(lineage.source_archive_sha256, 'ac8b37e81ad343153f920df18a8b1976a8e091cf5d22fb827feed63c62c9604c')
  assert.equal(lineage.frozen_vector_count, 36)
  assert.equal(fs.existsSync(path.join(PKG, 'reference', 'v07', 'conformance', 'agent_conformance_vectors.json')), true)
})
