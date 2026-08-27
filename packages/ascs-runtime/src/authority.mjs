export class AuthorityDeniedError extends Error {
  constructor(message = 'canonical mutation authority denied') {
    super(message)
    this.name = 'AuthorityDeniedError'
  }
}

const ACTOR_TYPES = new Set(['human', 'ai', 'system', 'importer'])

export function authorizeCanonicalMutation(authority) {
  const actor = authority?.actor
  const mode = authority?.mode
  if (!actor || !ACTOR_TYPES.has(actor.type) || typeof actor.id !== 'string' || !actor.id) {
    throw new AuthorityDeniedError('invalid canonical actor')
  }

  const allowed =
    (actor.type === 'human' && mode === 'explicit') ||
    (actor.type === 'ai' && mode === 'approved-proposal' && typeof authority.proposalId === 'string' && authority.proposalId.length > 0) ||
    (actor.type === 'system' && mode === 'policy-authorized')

  if (!allowed) throw new AuthorityDeniedError(`${actor.type} actor is not authorized for mode ${String(mode)}`)

  return {
    actor: { type: actor.type, id: actor.id, model: actor.model ?? null },
    policy: { mode },
    metadata: mode === 'approved-proposal' ? { proposal_id: authority.proposalId } : {},
  }
}
