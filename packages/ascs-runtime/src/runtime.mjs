import {
  contentAddress,
  revisionAddress,
  workspaceRevisionAddress,
  validateBundle,
  newUuid7Urn,
} from '../../ascs-core/src/index.mjs'
import { authorizeCanonicalMutation } from './authority.mjs'

export class ConflictError extends Error {
  constructor(base, current) {
    super(`stale base workspace revision: ${base} != ${current}`)
    this.name = 'ConflictError'
    this.base = base
    this.current = current
  }
}

function clone(value) {
  return structuredClone(value)
}

function defaultClock() {
  return new Date().toISOString()
}

function defaultIdFactory() {
  return newUuid7Urn()
}

function findObject(bundle, persistentId) {
  const object = bundle.object_records.find((item) => item.persistent_id === persistentId)
  if (!object) throw new RangeError(`unknown object: ${persistentId}`)
  return object
}

function findRevision(bundle, revisionId) {
  const revision = bundle.revision_records.find((item) => item.revision_id === revisionId)
  if (!revision) throw new RangeError(`unknown revision: ${revisionId}`)
  return revision
}

function findPlacement(bundle, persistentId) {
  const placement = bundle.workspace.placements.find((item) => item.object_id === persistentId)
  if (!placement) throw new RangeError(`object has no placement: ${persistentId}`)
  return placement
}

function setWorkspaceHead(bundle, persistentId, revisionId, relation = false) {
  const key = relation ? 'relation_heads' : 'object_heads'
  const heads = bundle.workspace[key]
  const item = heads.find((head) => head.persistent_id === persistentId)
  if (item) item.revision = revisionId
  else heads.push({ persistent_id: persistentId, revision: revisionId })
}

function addDecimal(value, delta) {
  const text = String(value)
  const fractional = text.match(/\.(\d+)$/)
  const number = Number(text)
  if (!Number.isFinite(number)) return text
  return fractional ? (number + delta).toFixed(fractional[1].length) : String(number + delta)
}

export class WorkspaceRuntime {
  constructor(bundle, options = {}) {
    this._bundle = clone(bundle)
    this._clock = options.clock || defaultClock
    this._idFactory = options.idFactory || defaultIdFactory
  }

  get workspaceRevision() {
    return this._bundle.workspace.workspace_revision
  }

  snapshot() {
    return clone(this._bundle)
  }

  object(persistentId) {
    return clone(findObject(this._bundle, persistentId))
  }

  revision(revisionId) {
    return clone(findRevision(this._bundle, revisionId))
  }

  objectHead(persistentId, branch = 'main') {
    return findObject(this._bundle, persistentId).heads[branch]
  }

  placementFor(persistentId) {
    return clone(findPlacement(this._bundle, persistentId))
  }

  _requireBase(baseWorkspaceRevision) {
    if (baseWorkspaceRevision !== this.workspaceRevision) {
      throw new ConflictError(baseWorkspaceRevision, this.workspaceRevision)
    }
  }

  _nextId(label) {
    return this._idFactory(label)
  }

  async _transaction({ op, baseWorkspaceRevision, authority, mutate }) {
    this._requireBase(baseWorkspaceRevision)
    const authorized = authorizeCanonicalMutation(authority)
    const draft = clone(this._bundle)
    const eventId = this._nextId(`event:${op}`)
    const createdAt = this._clock()
    const event = {
      record_type: 'event',
      event_id: eventId,
      actor: authorized.actor,
      op,
      inputs: [],
      outputs: [],
      base_workspace_revision: baseWorkspaceRevision,
      tool: { name: 'eveglyph-ascs-runtime', version: '0.1' },
      policy: authorized.policy,
      created_at: createdAt,
      metadata: authorized.metadata,
    }
    draft.event_records.push(event)

    const result = await mutate(draft, event, eventId, createdAt)
    draft.workspace.parents = [baseWorkspaceRevision]
    draft.workspace.event_id = eventId
    draft.workspace.created_at = createdAt
    draft.workspace.workspace_revision = await workspaceRevisionAddress(draft.workspace)

    const validation = await validateBundle(draft)
    if (!validation.ok) {
      const error = new Error(`canonical transaction validation failed: ${validation.errors.map((item) => item.code).join(', ')}`)
      error.name = 'CanonicalValidationError'
      error.errors = validation.errors
      throw error
    }

    this._bundle = draft
    return { status: 'Committed', workspace_revision: draft.workspace.workspace_revision, ...result }
  }

  async moveObject(persistentId, { x, y, baseWorkspaceRevision, authority }) {
    return this._transaction({
      op: 'move-object',
      baseWorkspaceRevision,
      authority,
      mutate: async (draft, event) => {
        const placement = findPlacement(draft, persistentId)
        placement.transform.x = String(x)
        placement.transform.y = String(y)
        event.inputs = [{ type: 'identity', value: persistentId }]
        event.outputs = [{ type: 'identity', value: persistentId }]
        return {}
      },
    })
  }

  async tryMoveObject(persistentId, options) {
    try {
      return await this.moveObject(persistentId, options)
    } catch (error) {
      if (error instanceof ConflictError) {
        return {
          status: 'Conflict',
          base_workspace_revision: error.base,
          current_workspace_revision: error.current,
        }
      }
      throw error
    }
  }

  async editIntrinsic(persistentId, { intrinsic, baseWorkspaceRevision, authority }) {
    return this._transaction({
      op: 'edit-intrinsic',
      baseWorkspaceRevision,
      authority,
      mutate: async (draft, event, eventId, createdAt) => {
        const object = findObject(draft, persistentId)
        const oldHead = object.heads.main
        const oldRevision = findRevision(draft, oldHead)
        const nextIntrinsic = clone(intrinsic)
        const revision = {
          record_type: 'revision',
          persistent_id: persistentId,
          revision_id: '',
          kind: oldRevision.kind,
          parents: [oldHead],
          content_address: await contentAddress(oldRevision.kind, nextIntrinsic),
          intrinsic: nextIntrinsic,
          event_id: eventId,
          created_at: createdAt,
          metadata: {},
        }
        revision.revision_id = await revisionAddress(revision)
        draft.revision_records.push(revision)
        object.heads.main = revision.revision_id
        setWorkspaceHead(draft, persistentId, revision.revision_id, object.kind === 'relation')
        event.inputs = [{ type: 'version', object: persistentId, revision: oldHead }]
        event.outputs = [{ type: 'version', object: persistentId, revision: revision.revision_id }]
        return { persistent_id: persistentId, revision_id: revision.revision_id }
      },
    })
  }

  async cloneObject(persistentId, { baseWorkspaceRevision, authority }) {
    return this._transaction({
      op: 'clone-object',
      baseWorkspaceRevision,
      authority,
      mutate: async (draft, event, eventId, createdAt) => {
        const sourceObject = findObject(draft, persistentId)
        const sourceHead = sourceObject.heads.main
        const sourceRevision = findRevision(draft, sourceHead)
        const cloneId = this._nextId('clone-target')
        const revision = {
          record_type: 'revision',
          persistent_id: cloneId,
          revision_id: '',
          kind: sourceRevision.kind,
          parents: [],
          content_address: sourceRevision.content_address,
          intrinsic: clone(sourceRevision.intrinsic),
          event_id: eventId,
          created_at: createdAt,
          metadata: { cloned_from: persistentId },
        }
        revision.revision_id = await revisionAddress(revision)
        const object = {
          record_type: 'object',
          persistent_id: cloneId,
          kind: sourceObject.kind,
          status: 'active',
          created_event: eventId,
          heads: { main: revision.revision_id },
          aliases: [],
          metadata: { cloned_from: persistentId },
        }
        draft.object_records.push(object)
        draft.revision_records.push(revision)
        setWorkspaceHead(draft, cloneId, revision.revision_id, object.kind === 'relation')

        const sourcePlacement = draft.workspace.placements.find((placement) => placement.object_id === persistentId)
        if (sourcePlacement) {
          const placement = clone(sourcePlacement)
          const token = cloneId.slice('urn:uuid:'.length).replaceAll('-', '').slice(0, 16)
          placement.placement_id = `place:${token}`
          placement.object_id = cloneId
          placement.transform.x = addDecimal(placement.transform.x, 80)
          placement.transform.y = addDecimal(placement.transform.y, 80)
          draft.workspace.placements.push(placement)
        }

        event.inputs = [{ type: 'version', object: persistentId, revision: sourceHead }]
        event.outputs = [{ type: 'version', object: cloneId, revision: revision.revision_id }]
        return { persistent_id: cloneId, revision_id: revision.revision_id }
      },
    })
  }
}

export async function createWorkspaceRuntime(bundle, options = {}) {
  const validation = await validateBundle(bundle)
  if (!validation.ok) {
    const error = new Error(`invalid canonical workspace: ${validation.errors.map((item) => item.code).join(', ')}`)
    error.name = 'CanonicalValidationError'
    error.errors = validation.errors
    throw error
  }
  return new WorkspaceRuntime(bundle, options)
}
