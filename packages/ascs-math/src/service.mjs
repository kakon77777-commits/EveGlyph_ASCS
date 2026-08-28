import { canonicalizeNativeMathObject, validateNativeMathObject } from './model.mjs'
import { projectNativeMathToLatex, projectNativeMathToMathML } from './adapters.mjs'

export class NativeMathValidationError extends Error {
  constructor(errors = []) {
    super(`Native Math validation failed: ${errors.map((item) => item.code ?? String(item)).join(', ')}`)
    this.name = 'NativeMathValidationError'
    this.errors = errors
  }
}

export class NativeMathProfileError extends Error {
  constructor(profile) {
    super(`Native Math candidate profile required, got ${String(profile)}`)
    this.name = 'NativeMathProfileError'
    this.profile = profile
  }
}

function requireBridge(bridge) {
  for (const name of ['objectHead', 'revision', 'editIntrinsic']) {
    if (typeof bridge?.[name] !== 'function') throw new TypeError(`Native Math service bridge requires ${name}()`)
  }
  return bridge
}

function currentRevision(bridge, persistentId) {
  const revisionId = bridge.objectHead(persistentId)
  const revision = bridge.revision(revisionId)
  if (revision?.kind !== 'math') throw new TypeError(`object ${persistentId} is not a math object`)
  return { revisionId, revision }
}

function profileInfo(intrinsic) {
  const profile = intrinsic?.profile ?? null
  if (profile === 'ncm/1.0-candidate.1') {
    return { profile, candidate_profile: true, migration: 'not-required' }
  }
  if (profile === 'ncm/0.1') {
    return { profile, candidate_profile: false, migration: 'explicit-optional' }
  }
  return { profile, candidate_profile: false, migration: 'unsupported-profile' }
}

function requireCandidate(intrinsic) {
  if (intrinsic?.profile !== 'ncm/1.0-candidate.1') throw new NativeMathProfileError(intrinsic?.profile)
  return intrinsic
}

export function createNativeMathService(workspaceBridge) {
  const bridge = requireBridge(workspaceBridge)

  return Object.freeze({
    inspect(persistentId) {
      const { revisionId, revision } = currentRevision(bridge, persistentId)
      return Object.freeze({
        persistent_id: persistentId,
        revision_id: revisionId,
        kind: revision.kind,
        ...profileInfo(revision.intrinsic),
      })
    },

    async validate(persistentId) {
      const { revision } = currentRevision(bridge, persistentId)
      const info = profileInfo(revision.intrinsic)
      if (!info.candidate_profile) {
        return { ok: info.profile === 'ncm/0.1', errors: [], ...info }
      }
      return { ...validateNativeMathObject(revision.intrinsic), ...info }
    },

    projectLatex(persistentId) {
      const { revision } = currentRevision(bridge, persistentId)
      return projectNativeMathToLatex(requireCandidate(revision.intrinsic))
    },

    projectMathML(persistentId) {
      const { revision } = currentRevision(bridge, persistentId)
      return projectNativeMathToMathML(requireCandidate(revision.intrinsic))
    },

    async edit(persistentId, { math, baseWorkspaceRevision, authority } = {}) {
      const { revision } = currentRevision(bridge, persistentId)
      if (revision.kind !== 'math') throw new TypeError(`object ${persistentId} is not a math object`)
      const canonical = canonicalizeNativeMathObject(structuredClone(math))
      const validation = validateNativeMathObject(canonical)
      if (!validation.ok) throw new NativeMathValidationError(validation.errors)
      return bridge.editIntrinsic(persistentId, {
        intrinsic: canonical,
        baseWorkspaceRevision,
        authority,
      })
    },
  })
}
