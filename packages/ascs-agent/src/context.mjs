import { canonicalBytes, sha256Hex } from '../../ascs-core/src/index.mjs'
import { validateContextPack } from './model.mjs'

function clone(value) {
  return structuredClone(value)
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function asBytes(value) {
  if (value instanceof Uint8Array) return value
  if (typeof value === 'string') return new TextEncoder().encode(value)
  if (value === null || value === undefined) return null
  throw new TypeError('context source resolver must return Uint8Array, string, or null')
}

export async function contextPackAddress(pack) {
  const preimage = clone(pack)
  delete preimage.context_pack_id
  return `context-pack:sha256:${await sha256Hex(canonicalBytes(preimage))}`
}

export async function buildContextPack(input) {
  const record = clone(input)
  delete record.context_pack_id
  record.context_pack_id = await contextPackAddress(record)
  const check = validateContextPack(record)
  if (!check.ok) {
    throw new TypeError(`invalid ContextPack: ${check.errors.map((entry) => `${entry.path}:${entry.code}`).join(', ')}`)
  }
  return deepFreeze(record)
}

export function classifyContextTrust({ role, authorityOrigin }) {
  if (authorityOrigin === 'generated') return 'generated-data'
  if (role === 'user-directive' && authorityOrigin === 'explicit-user') return 'directive'
  if (role === 'workspace-policy' && authorityOrigin === 'committed-policy') return 'trusted-policy'
  if ((role === 'protected-glossary' || role === 'workspace-memory') && authorityOrigin === 'committed-data') return 'trusted-data'
  if (role === 'adapter-metadata') return 'generated-data'
  if (role === 'workspace-document' || role === 'selection' || role === 'external-resource') return 'untrusted-data'
  return authorityOrigin === 'committed-data' ? 'trusted-data' : 'untrusted-data'
}

export async function verifyContextFresh(pack, resolveSourceBytes) {
  if (typeof resolveSourceBytes !== 'function') throw new TypeError('resolveSourceBytes must be a function')
  const staleSources = []
  for (const source of pack.sources ?? []) {
    const resolved = asBytes(await resolveSourceBytes(source.ref))
    const observed = resolved === null ? null : await sha256Hex(resolved)
    if (observed !== source.content_sha256) {
      staleSources.push(Object.freeze({
        source_id: source.source_id,
        ref: source.ref,
        expected_sha256: source.content_sha256,
        observed_sha256: observed,
        reason: resolved === null ? 'source-unavailable' : 'content-hash-mismatch',
      }))
    }
  }
  return Object.freeze({ ok: staleSources.length === 0, staleSources: Object.freeze(staleSources) })
}

export async function verifyToolManifestFresh(pack, resolveToolSchemaHash) {
  if (typeof resolveToolSchemaHash !== 'function') throw new TypeError('resolveToolSchemaHash must be a function')
  const staleTools = []
  for (const tool of pack.tool_manifest?.tools ?? []) {
    const observed = await resolveToolSchemaHash(tool.name)
    if (observed !== tool.schema_hash) {
      staleTools.push(Object.freeze({
        name: tool.name,
        expected_schema_hash: tool.schema_hash,
        observed_schema_hash: observed ?? null,
        reason: observed == null ? 'tool-schema-unavailable' : 'tool-schema-hash-mismatch',
      }))
    }
  }
  return Object.freeze({ ok: staleTools.length === 0, staleTools: Object.freeze(staleTools) })
}
