const BINDING_AUTHORITIES = new Set(['candidate', 'explicit', 'derived-validated', 'revoked'])

export function validateGlyphBinding(binding) {
  const errors = []
  if (binding?.profile !== 'glyph-binding/1.0-candidate.1') errors.push('glyph binding candidate profile required')
  if (!BINDING_AUTHORITIES.has(binding?.authority)) errors.push('invalid binding authority')
  if (!binding?.glyph_ref?.persistent_id || !binding?.glyph_ref?.revision_id) errors.push('binding must pin glyph persistent and revision identity')
  if (binding?.kind === 'behavior' && !(binding.required_capabilities ?? []).includes('runtime.execute')) errors.push('behavior binding requires runtime.execute capability declaration')
  if (binding?.authority === 'candidate' && binding?.provenance?.evidence_class === 'declared' && binding?.provenance?.actor_class === 'system') errors.push('system-declared candidate is ill-formed authority combination')
  if (binding?.kind === 'semantic-symbol') for (const key of ['registry', 'symbol', 'version']) if (!(key in (binding.target ?? {}))) errors.push(`semantic-symbol binding target missing ${key}`)
  if (binding?.kind === 'unicode-sequence') {
    const cps = binding?.target?.codepoints
    if (!Array.isArray(cps) || cps.length === 0) errors.push('unicode-sequence binding requires non-empty codepoints')
  }
  if (binding?.kind === 'opentype-glyph' && (!('font_digest' in (binding.target ?? {})) || !('glyph_id' in (binding.target ?? {})))) errors.push('opentype-glyph binding requires font_digest and glyph_id')
  return { ok: errors.length === 0, errors }
}

function explicitAuthority(authority) {
  return authority?.mode === 'explicit' && (authority.actor?.type === 'human' || authority.actor?.type === 'system')
}

export function promoteBindingCandidate(candidate, authority) {
  const validation = validateGlyphBinding(candidate)
  if (!validation.ok) throw new TypeError(validation.errors.join('; '))
  if (candidate.authority !== 'candidate') throw new TypeError('only candidate binding may be promoted')
  if (!explicitAuthority(authority)) throw new Error('binding promotion requires explicit ASCS authority')
  return Object.freeze({ ...structuredClone(candidate), authority: 'explicit', provenance: { ...candidate.provenance, promoted_by: authority.actor.type } })
}

export function revokeBinding(binding, authority) {
  const validation = validateGlyphBinding(binding)
  if (!validation.ok) throw new TypeError(validation.errors.join('; '))
  if (!explicitAuthority(authority)) throw new Error('binding revocation requires explicit ASCS authority')
  return Object.freeze({ ...structuredClone(binding), authority: 'revoked', provenance: { ...binding.provenance, revoked_by: authority.actor.type } })
}

export function bindGlyphToMathSymbol(glyphRef, symbolRef, provenance = { actor_class: 'human', tool: 'eveglyph', evidence_class: 'declared' }) {
  return Object.freeze({
    profile: 'glyph-binding/1.0-candidate.1',
    binding_id: `math:${symbolRef.registry}:${symbolRef.symbol}:${symbolRef.version}`,
    glyph_ref: structuredClone(glyphRef),
    kind: 'semantic-symbol',
    authority: 'candidate',
    target: { registry: String(symbolRef.registry), symbol: String(symbolRef.symbol), version: String(symbolRef.version) },
    required_capabilities: [],
    provenance: structuredClone(provenance),
  })
}

export function validateMathGlyphBinding(binding) {
  const base = validateGlyphBinding(binding)
  return { ...base, math_symbol: base.ok && binding.kind === 'semantic-symbol', identity_collapse: false }
}
