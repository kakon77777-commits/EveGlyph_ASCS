const SAFE_INTEGER = Number.MAX_SAFE_INTEGER
export const CANONICALIZATION = 'egir-cj/0.1'

function assertUnicodeScalars(value) {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if (code >= 0xd800 && code <= 0xdbff) {
      if (i + 1 >= value.length) throw new TypeError('string contains unpaired surrogate')
      const next = value.charCodeAt(i + 1)
      if (next < 0xdc00 || next > 0xdfff) throw new TypeError('string contains unpaired surrogate')
      i += 1
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new TypeError('string contains unpaired surrogate')
    }
  }
}

function compareCodePoints(a, b) {
  const aa = Array.from(a, (ch) => ch.codePointAt(0))
  const bb = Array.from(b, (ch) => ch.codePointAt(0))
  const n = Math.min(aa.length, bb.length)
  for (let i = 0; i < n; i += 1) {
    if (aa[i] !== bb[i]) return aa[i] - bb[i]
  }
  return aa.length - bb.length
}

function canonicalText(value) {
  if (value === null) return 'null'
  if (value === true) return 'true'
  if (value === false) return 'false'
  if (typeof value === 'string') {
    assertUnicodeScalars(value)
    return JSON.stringify(value)
  }
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) throw new TypeError('floats forbidden in EGIR-CJ/0.1 hash preimages')
    if (!Number.isSafeInteger(value) || Math.abs(value) > SAFE_INTEGER) throw new TypeError('unsafe structural integer')
    return String(Object.is(value, -0) ? 0 : value)
  }
  if (Array.isArray(value)) return `[${value.map(canonicalText).join(',')}]`
  if (typeof value === 'object' && value !== undefined) {
    const proto = Object.getPrototypeOf(value)
    if (proto !== Object.prototype && proto !== null) throw new TypeError('EGIR-CJ only accepts plain objects')
    const keys = Object.keys(value).sort(compareCodePoints)
    return `{${keys.map((key) => `${canonicalText(key)}:${canonicalText(value[key])}`).join(',')}}`
  }
  throw new TypeError(`unsupported EGIR-CJ value: ${typeof value}`)
}

export function canonicalBytes(value) {
  return new TextEncoder().encode(canonicalText(value))
}

export async function sha256Hex(bytes) {
  if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function contentAddress(kind, intrinsic) {
  const digest = await sha256Hex(canonicalBytes({ canon: CANONICALIZATION, kind, intrinsic }))
  return `content:sha256:${digest}`
}

export async function revisionAddress(record) {
  const digest = await sha256Hex(canonicalBytes({
    canon: CANONICALIZATION,
    persistent_id: record.persistent_id,
    kind: record.kind,
    parents: [...record.parents].sort(compareCodePoints),
    content_address: record.content_address,
    event_id: record.event_id,
    created_at: record.created_at,
  }))
  return `rev:sha256:${digest}`
}

function sortHeads(items) {
  return [...items].sort((a, b) => compareCodePoints(a.persistent_id, b.persistent_id) || compareCodePoints(a.revision, b.revision))
}

function sortPlacements(items) {
  return [...items].sort((a, b) => compareCodePoints(a.object_id, b.object_id) || compareCodePoints(a.region_id || '', b.region_id || '') || compareCodePoints(a.placement_id, b.placement_id))
}

export async function workspaceRevisionAddress(workspace) {
  const digest = await sha256Hex(canonicalBytes({
    canon: CANONICALIZATION,
    workspace_id: workspace.workspace_id,
    parents: [...workspace.parents].sort(compareCodePoints),
    object_heads: sortHeads(workspace.object_heads),
    relation_heads: sortHeads(workspace.relation_heads),
    placements: sortPlacements(workspace.placements),
    event_id: workspace.event_id,
    created_at: workspace.created_at,
  }))
  return `wrev:sha256:${digest}`
}
