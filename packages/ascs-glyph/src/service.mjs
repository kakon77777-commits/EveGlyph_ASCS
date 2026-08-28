import { canonicalizeGlyphObject, validateGlyphObject } from './model.mjs'
import { projectGlyphToSvg, projectGlyphAccessibility } from './adapters.mjs'
import { validateGlyphBinding, promoteBindingCandidate, revokeBinding } from './binding.mjs'

export class NativeGlyphValidationError extends Error {
  constructor(errors = []) {
    super(`Native Glyph validation failed: ${errors.map((item) => item.code ?? String(item)).join(', ')}`)
    this.name = 'NativeGlyphValidationError'
    this.errors = errors
  }
}

export class NativeGlyphProfileError extends Error {
  constructor(profile) {
    super(`Native Glyph candidate profile required, got ${String(profile)}`)
    this.name = 'NativeGlyphProfileError'
    this.profile = profile
  }
}

function requireBridge(bridge) {
  for (const name of ['objectHead', 'revision', 'editIntrinsic']) {
    if (typeof bridge?.[name] !== 'function') throw new TypeError(`Native Glyph service bridge requires ${name}()`)
  }
  return bridge
}

function currentRevision(bridge, persistentId) {
  const revisionId = bridge.objectHead(persistentId)
  const revision = bridge.revision(revisionId)
  if (revision?.kind !== 'glyph') throw new TypeError(`object ${persistentId} is not a glyph object`)
  return { revisionId, revision }
}

function profileInfo(intrinsic) {
  const profile = intrinsic?.profile ?? null
  if (profile === 'glyph/1.0-candidate.1') return { profile, candidate_profile: true, migration: 'not-required' }
  if (profile === 'glyph/0.1') return { profile, candidate_profile: false, migration: 'explicit-optional' }
  return { profile, candidate_profile: false, migration: 'unsupported-profile' }
}
function requireCandidate(intrinsic) {
  if (intrinsic?.profile !== 'glyph/1.0-candidate.1') throw new NativeGlyphProfileError(intrinsic?.profile)
  return intrinsic
}

export function createNativeGlyphService(workspaceBridge) {
  const bridge = requireBridge(workspaceBridge)
  return Object.freeze({
    inspect(persistentId) {
      const { revisionId, revision } = currentRevision(bridge, persistentId)
      return Object.freeze({ persistent_id: persistentId, revision_id: revisionId, kind: revision.kind, ...profileInfo(revision.intrinsic) })
    },
    validate(persistentId) {
      const { revision } = currentRevision(bridge, persistentId)
      const info = profileInfo(revision.intrinsic)
      if (!info.candidate_profile) return { ok: info.profile === 'glyph/0.1', errors: [], ...info }
      return { ...validateGlyphObject(revision.intrinsic), ...info }
    },
    projectSvg(persistentId) {
      const { revision } = currentRevision(bridge, persistentId)
      return projectGlyphToSvg(requireCandidate(revision.intrinsic))
    },
    projectAccessibility(persistentId, bindings = []) {
      const { revision } = currentRevision(bridge, persistentId)
      return projectGlyphAccessibility(requireCandidate(revision.intrinsic), bindings)
    },
    async edit(persistentId, { glyph, baseWorkspaceRevision, authority } = {}) {
      currentRevision(bridge, persistentId)
      const canonical = canonicalizeGlyphObject(structuredClone(glyph))
      const validation = validateGlyphObject(canonical)
      if (!validation.ok) throw new NativeGlyphValidationError(validation.errors)
      return bridge.editIntrinsic(persistentId, { intrinsic: canonical, baseWorkspaceRevision, authority })
    },
    createBindingCandidate(binding) {
      const candidate = structuredClone(binding)
      candidate.authority = 'candidate'
      const validation = validateGlyphBinding(candidate)
      if (!validation.ok) throw new NativeGlyphValidationError(validation.errors.map((message) => ({ code: 'E_BINDING', message })))
      return Object.freeze(candidate)
    },
    promoteBinding(binding, authority) {
      return promoteBindingCandidate(binding, authority)
    },
    revokeBinding(binding, authority) {
      return revokeBinding(binding, authority)
    },
  })
}
