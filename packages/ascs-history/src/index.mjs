import {
  newUuid7Urn,
  validateBundle,
  workspaceRevisionAddress,
} from '../../ascs-core/src/index.mjs'
import { authorizeCanonicalMutation } from '../../ascs-runtime/src/index.mjs'

const HISTORY_KEY = 'meta/history/state.json'

function clone(value) { return structuredClone(value) }
function nowIso() { return new Date().toISOString() }

export class HistoryError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'HistoryError'
    this.code = code
    Object.assign(this, details)
  }
}

function branchRecord({ branchId, name, head, createdFrom = null }) {
  return {
    branch_id: branchId,
    name,
    head,
    created_from: createdFrom,
    status: 'active',
    publication_class: 'unpublished-local',
    metadata: {},
  }
}

function stateTemplate() {
  return {
    profile: 'org.evemisslab.history/0.1',
    branches: {},
    commits: {},
    recoveries: {},
    retention: {},
    extensions: {},
  }
}

function objectMap(bundle) {
  return new Map(bundle.object_records.map((record) => [record.persistent_id, record]))
}
function headMap(workspace, key) {
  return new Map((workspace[key] ?? []).map((head) => [head.persistent_id, head.revision]))
}
function placementMap(bundle) {
  return new Map((bundle.workspace.placements ?? []).map((placement) => [placement.object_id, placement]))
}
function cloneUniqueBy(arrays, key) {
  const map = new Map()
  for (const array of arrays) for (const item of array ?? []) map.set(item[key], clone(item))
  return [...map.values()]
}
function equalJson(a, b) { return JSON.stringify(a) === JSON.stringify(b) }
function changeState(base, side) { return equalJson(base, side) ? 'same' : 'changed' }

function conflictRecord(type, { baseRevision, leftRevision, rightRevision, target, base, left, right }) {
  return {
    profile: 'org.evemisslab.history-conflict/0.1',
    conflict_type: type,
    base_workspace_revision: baseRevision,
    left_workspace_revision: leftRevision,
    right_workspace_revision: rightRevision,
    target: { type: target.type, value: target.value },
    base: clone(base), left: clone(left), right: clone(right),
    status: 'unresolved', resolution: null,
  }
}

function chooseThreeWay(base, left, right) {
  const lc = changeState(base, left) === 'changed'
  const rc = changeState(base, right) === 'changed'
  if (!lc && !rc) return { status: 'same', value: clone(base) }
  if (lc && !rc) return { status: 'left', value: clone(left) }
  if (!lc && rc) return { status: 'right', value: clone(right) }
  if (equalJson(left, right)) return { status: 'both-same', value: clone(left) }
  return { status: 'conflict', base: clone(base), left: clone(left), right: clone(right) }
}

function mergeWorkspaceChannels(base, left, right) {
  const merged = clone(base)
  const conflicts = []
  const baseObjects = objectMap(base)
  const leftObjects = objectMap(left)
  const rightObjects = objectMap(right)
  const baseHeads = headMap(base.workspace, 'object_heads')
  const leftHeads = headMap(left.workspace, 'object_heads')
  const rightHeads = headMap(right.workspace, 'object_heads')
  const baseRelations = headMap(base.workspace, 'relation_heads')
  const leftRelations = headMap(left.workspace, 'relation_heads')
  const rightRelations = headMap(right.workspace, 'relation_heads')
  const basePlacements = placementMap(base)
  const leftPlacements = placementMap(left)
  const rightPlacements = placementMap(right)

  const ids = new Set([
    ...baseObjects.keys(), ...leftObjects.keys(), ...rightObjects.keys(),
    ...baseHeads.keys(), ...leftHeads.keys(), ...rightHeads.keys(),
    ...baseRelations.keys(), ...leftRelations.keys(), ...rightRelations.keys(),
    ...basePlacements.keys(), ...leftPlacements.keys(), ...rightPlacements.keys(),
  ])

  const objectResults = new Map()
  const placementResults = new Map()
  const relationResults = new Map()

  for (const id of ids) {
    const bo = baseObjects.get(id) ?? null
    const lo = leftObjects.get(id) ?? bo
    const ro = rightObjects.get(id) ?? bo
    const baseLifecycle = bo?.status ?? null
    const leftLifecycle = lo?.status ?? null
    const rightLifecycle = ro?.status ?? null
    const lifecycle = chooseThreeWay(baseLifecycle, leftLifecycle, rightLifecycle)

    const bh = baseHeads.get(id) ?? null
    const lh = leftHeads.get(id) ?? bh
    const rh = rightHeads.get(id) ?? bh
    const content = chooseThreeWay(bh, lh, rh)

    const bp = basePlacements.get(id) ?? null
    const lp = leftPlacements.get(id) ?? bp
    const rp = rightPlacements.get(id) ?? bp
    const placement = chooseThreeWay(bp, lp, rp)

    const br = baseRelations.get(id) ?? null
    const lr = leftRelations.get(id) ?? br
    const rr = rightRelations.get(id) ?? br
    const relation = chooseThreeWay(br, lr, rr)

    const tombstoneLeft = baseLifecycle !== 'tombstoned' && leftLifecycle === 'tombstoned'
    const tombstoneRight = baseLifecycle !== 'tombstoned' && rightLifecycle === 'tombstoned'
    const rightSemanticChange = content.status === 'right' || placement.status === 'right' || relation.status === 'right' || content.status === 'conflict' || placement.status === 'conflict' || relation.status === 'conflict'
    const leftSemanticChange = content.status === 'left' || placement.status === 'left' || relation.status === 'left' || content.status === 'conflict' || placement.status === 'conflict' || relation.status === 'conflict'

    if ((tombstoneLeft && rightSemanticChange) || (tombstoneRight && leftSemanticChange) || lifecycle.status === 'conflict') {
      conflicts.push(conflictRecord('lifecycle', {
        baseRevision: base.workspace.workspace_revision, leftRevision: left.workspace.workspace_revision, rightRevision: right.workspace.workspace_revision,
        target: { type: 'identity', value: id }, base: baseLifecycle, left: leftLifecycle, right: rightLifecycle,
      }))
      continue
    }
    if (content.status === 'conflict') {
      conflicts.push(conflictRecord('object-content', {
        baseRevision: base.workspace.workspace_revision, leftRevision: left.workspace.workspace_revision, rightRevision: right.workspace.workspace_revision,
        target: { type: 'identity', value: id }, base: bh, left: lh, right: rh,
      }))
    }
    if (placement.status === 'conflict') {
      conflicts.push(conflictRecord('placement', {
        baseRevision: base.workspace.workspace_revision, leftRevision: left.workspace.workspace_revision, rightRevision: right.workspace.workspace_revision,
        target: { type: 'identity', value: id }, base: bp, left: lp, right: rp,
      }))
    }
    if (relation.status === 'conflict') {
      conflicts.push(conflictRecord('relation', {
        baseRevision: base.workspace.workspace_revision, leftRevision: left.workspace.workspace_revision, rightRevision: right.workspace.workspace_revision,
        target: { type: 'identity', value: id }, base: br, left: lr, right: rr,
      }))
    }

    if (lifecycle.status !== 'conflict') {
      const chosenObject = lifecycle.status === 'left' ? lo : lifecycle.status === 'right' ? ro : (lo ?? ro ?? bo)
      if (chosenObject) objectResults.set(id, clone(chosenObject))
    }
    if (content.status !== 'conflict') {
      const chosenHead = content.value
      if (chosenHead != null && objectResults.has(id)) objectResults.get(id).heads.main = chosenHead
    }
    if (placement.status !== 'conflict' && placement.value != null) placementResults.set(id, clone(placement.value))
    if (relation.status !== 'conflict' && relation.value != null) relationResults.set(id, relation.value)
  }

  if (conflicts.length) return { status: 'Conflict', conflicts, bundle: null }

  merged.object_records = [...objectResults.values()]
  merged.revision_records = cloneUniqueBy([base.revision_records, left.revision_records, right.revision_records], 'revision_id')
  merged.event_records = cloneUniqueBy([base.event_records, left.event_records, right.event_records], 'event_id')
  merged.candidate_records = cloneUniqueBy([base.candidate_records, left.candidate_records, right.candidate_records], 'candidate_id')
  merged.workspace.object_heads = [...objectResults.values()]
    .filter((record) => record.kind !== 'relation')
    .map((record) => ({ persistent_id: record.persistent_id, revision: record.heads.main }))
    .sort((a, b) => a.persistent_id.localeCompare(b.persistent_id))
  merged.workspace.relation_heads = [...objectResults.values()]
    .filter((record) => record.kind === 'relation')
    .map((record) => ({ persistent_id: record.persistent_id, revision: relationResults.get(record.persistent_id) ?? record.heads.main }))
    .sort((a, b) => a.persistent_id.localeCompare(b.persistent_id))
  merged.workspace.placements = [...placementResults.values()].sort((a, b) => a.placement_id.localeCompare(b.placement_id))
  return { status: 'Merged', conflicts: [], bundle: merged }
}

async function finalizeWorkspace(bundle, { parents, authority, op, metadata = {} }) {
  const authorized = authorizeCanonicalMutation(authority)
  const draft = clone(bundle)
  const eventId = newUuid7Urn()
  const createdAt = nowIso()
  draft.event_records.push({
    record_type: 'event', event_id: eventId, actor: authorized.actor, op,
    inputs: [], outputs: [], base_workspace_revision: parents[0] ?? null,
    tool: { name: 'eveglyph-ascs-history', version: '0.1' }, policy: authorized.policy,
    created_at: createdAt, metadata: { ...authorized.metadata, ...metadata },
  })
  draft.workspace.parents = [...parents]
  draft.workspace.event_id = eventId
  draft.workspace.created_at = createdAt
  draft.workspace.workspace_revision = await workspaceRevisionAddress(draft.workspace)
  const validation = await validateBundle(draft)
  if (!validation.ok) throw new HistoryError('InvalidMergedBundle', `history-produced bundle failed canonical validation: ${validation.errors.map((x) => x.code).join(', ')}`, { errors: validation.errors })
  return draft
}

export function classifyHistoryVector(vector) {
  if (vector.current_head && vector.command_base) return { result_class: vector.current_head === vector.command_base ? 'Committed' : 'Conflict', canonical_state_changed: vector.current_head === vector.command_base }
  if (vector.recovery_base && vector.current_head) return vector.recovery_base === vector.current_head
    ? { result_class: 'replay-through-normal-validation' }
    : { result_class: 'branch-rebase-or-merge-required', silent_replay: false }
  if (vector.proposal_base && vector.current_head) return { result_class: vector.proposal_base === vector.current_head ? 'candidate-valid' : 'candidate-or-branch', direct_overwrite: false }
  if (vector.history && vector.revert_target) return { result_class: 'new-revert-commit', new_parent: vector.history.at(-1), target_still_reachable: vector.history.includes(vector.revert_target) }
  if (Number.isInteger(vector.pending_commands)) return { workspace_head_after: vector.workspace_head_before, recovery_capsule_created: true, canonical_commit_created: false }
  if (vector.left_head && vector.right_head) return vector.unresolved_conflicts === 0
    ? { result_class: 'merge-commit', parents: [vector.left_head, vector.right_head] }
    : { result_class: 'conflict' }

  const base = vector.base ?? {}
  const left = vector.left ?? base
  const right = vector.right ?? base
  const lifecycle = chooseThreeWay(base.lifecycle, left.lifecycle, right.lifecycle)
  const content = chooseThreeWay(base.content, left.content, right.content)
  const placement = chooseThreeWay(base.placement, left.placement, right.placement)
  if ((base.lifecycle !== 'tombstoned' && left.lifecycle === 'tombstoned' && (content.status === 'right' || placement.status === 'right')) ||
      (base.lifecycle !== 'tombstoned' && right.lifecycle === 'tombstoned' && (content.status === 'left' || placement.status === 'left')) || lifecycle.status === 'conflict') {
    return { result_class: 'conflict', conflict_type: 'lifecycle' }
  }
  if (content.status === 'conflict') return { result_class: 'conflict', conflict_type: 'object-content' }
  if (placement.status === 'conflict') return { result_class: 'conflict', conflict_type: 'placement' }
  const output = { result_class: 'auto-merge', conflicts: [] }
  if ('content' in base || 'content' in left || 'content' in right) output.content = content.value
  if ('placement' in base || 'placement' in left || 'placement' in right) output.placement = placement.value
  return output
}

export class HistoryRepository {
  constructor(store, state) {
    this.store = store
    this._state = state
  }

  branch(branchId) {
    const branch = this._state.branches[branchId]
    if (!branch) throw new HistoryError('UnknownBranch', `unknown branch ${branchId}`)
    return clone(branch)
  }

  async _persistState(next = this._state) {
    await this.store.carrier.put(HISTORY_KEY, next)
    this._state = clone(next)
  }

  async renameBranch(branchId, name) {
    const next = clone(this._state)
    if (!next.branches[branchId]) throw new HistoryError('UnknownBranch', `unknown branch ${branchId}`)
    if (typeof name !== 'string' || !name) throw new TypeError('branch name is required')
    next.branches[branchId].name = name
    await this._persistState(next)
    return this.branch(branchId)
  }

  async archiveBranch(branchId) {
    const next = clone(this._state)
    if (!next.branches[branchId]) throw new HistoryError('UnknownBranch', `unknown branch ${branchId}`)
    next.branches[branchId].status = 'archived'
    await this._persistState(next)
    return this.branch(branchId)
  }

  async forkBranch({ sourceRevision, branchId, name }) {
    if (!this._state.commits[sourceRevision]) throw new HistoryError('UnknownRevision', `unknown source revision ${sourceRevision}`)
    if (this._state.branches[branchId]) throw new HistoryError('BranchExists', `branch already exists ${branchId}`)
    const next = clone(this._state)
    next.branches[branchId] = branchRecord({ branchId, name, head: sourceRevision, createdFrom: sourceRevision })
    await this._persistState(next)
    return this.branch(branchId)
  }

  async _recordSnapshot(bundle, { reason = 'checkpoint', authority = null, parents = null } = {}) {
    const revision = bundle.workspace.workspace_revision
    if (this._state.commits[revision]) return clone(this._state.commits[revision])
    if (authority) authorizeCanonicalMutation(authority)
    const manifest = await this.store.commitBundle(bundle, { name: `${revision}.egir.json`, mediaType: 'application/json' })
    return {
      workspace_revision: revision,
      workspace_id: bundle.workspace.workspace_id,
      manifest_id: manifest.manifest_id,
      parents: clone(parents ?? bundle.workspace.parents ?? []),
      reason,
      created_at: bundle.workspace.created_at,
      authority: authority ? clone(authorizeCanonicalMutation(authority)) : null,
    }
  }

  async checkpoint(bundle, { branchId, expectedHead, authority, reason = 'checkpoint' }) {
    const branch = this._state.branches[branchId]
    if (!branch) throw new HistoryError('UnknownBranch', `unknown branch ${branchId}`)
    if (branch.head !== expectedHead) throw new HistoryError('Conflict', `stale history head ${expectedHead} != ${branch.head}`, { expectedHead, currentHead: branch.head })
    authorizeCanonicalMutation(authority)
    const validation = await validateBundle(bundle)
    if (!validation.ok) throw new HistoryError('InvalidBundle', 'checkpoint bundle failed canonical validation', { errors: validation.errors })
    const commit = await this._recordSnapshot(bundle, { reason, authority, parents: bundle.workspace.parents })
    const next = clone(this._state)
    next.commits[commit.workspace_revision] = commit
    next.branches[branchId].head = commit.workspace_revision
    next.branches[branchId].status = 'active'
    await this._persistState(next)
    return clone(commit)
  }

  async explainHistory(workspaceRevision) {
    const commit = this._state.commits[workspaceRevision]
    if (!commit) throw new HistoryError('UnknownRevision', `unknown revision ${workspaceRevision}`)
    return clone(commit)
  }

  async loadSnapshot(workspaceRevision) {
    const commit = this._state.commits[workspaceRevision]
    if (!commit) throw new HistoryError('UnknownRevision', `unknown revision ${workspaceRevision}`)
    return this.store.loadBundle(commit.manifest_id)
  }

  async autosaveRecovery(capsule) {
    if (capsule?.profile !== 'org.evemisslab.recovery/0.1' || !capsule.session_id) throw new HistoryError('InvalidRecoveryCapsule', 'invalid recovery capsule')
    const next = clone(this._state)
    next.recoveries[capsule.session_id] = clone(capsule)
    await this._persistState(next)
    return { status: 'Saved', session_id: capsule.session_id, canonical_commit_created: false }
  }

  async recoveryDecision(sessionId, currentHead) {
    const capsule = this._state.recoveries[sessionId]
    if (!capsule) return { status: 'no-recovery-capsule' }
    return capsule.base_workspace_revision === currentHead
      ? { status: 'replay-through-normal-validation', silent_replay: false }
      : { status: 'branch-rebase-or-merge-required', silent_replay: false }
  }

  async planMerge({ baseRevision, leftRevision, rightRevision }) {
    const [base, left, right] = await Promise.all([
      this.loadSnapshot(baseRevision), this.loadSnapshot(leftRevision), this.loadSnapshot(rightRevision),
    ])
    return mergeWorkspaceChannels(base, left, right)
  }

  async commitMerge({ targetBranchId, baseRevision, leftRevision, rightRevision, authority }) {
    const target = this._state.branches[targetBranchId]
    if (!target) throw new HistoryError('UnknownBranch', `unknown branch ${targetBranchId}`)
    authorizeCanonicalMutation(authority)
    const plan = await this.planMerge({ baseRevision, leftRevision, rightRevision })
    if (plan.status !== 'Merged') throw new HistoryError('UnresolvedConflicts', 'merge has unresolved conflicts', { conflicts: plan.conflicts })
    const bundle = await finalizeWorkspace(plan.bundle, { parents: [leftRevision, rightRevision], authority, op: 'history-merge', metadata: { base_revision: baseRevision } })
    const commit = await this._recordSnapshot(bundle, { reason: 'merge', authority, parents: [leftRevision, rightRevision] })
    const next = clone(this._state)
    next.commits[commit.workspace_revision] = commit
    next.branches[targetBranchId].head = commit.workspace_revision
    next.branches[targetBranchId].status = 'active'
    await this._persistState(next)
    return clone(commit)
  }

  async revert({ branchId, targetRevision, authority }) {
    const branch = this._state.branches[branchId]
    if (!branch) throw new HistoryError('UnknownBranch', `unknown branch ${branchId}`)
    authorizeCanonicalMutation(authority)
    const target = await this.loadSnapshot(targetRevision)
    const currentHead = branch.head
    const bundle = await finalizeWorkspace(target, { parents: [currentHead], authority, op: 'history-revert', metadata: { revert_target: targetRevision } })
    const commit = await this._recordSnapshot(bundle, { reason: 'revert', authority, parents: [currentHead] })
    const next = clone(this._state)
    next.commits[commit.workspace_revision] = commit
    next.branches[branchId].head = commit.workspace_revision
    next.branches[branchId].status = 'active'
    await this._persistState(next)
    return clone(commit)
  }
}

export async function createHistoryRepository({ store, initialBundle = null, branch = null }) {
  if (!store?.carrier || !store?.commitBundle || !store?.loadBundle) throw new TypeError('history repository requires an EGStore')
  const existing = await store.carrier.get(HISTORY_KEY)
  if (existing) return new HistoryRepository(store, existing)
  if (!initialBundle) throw new HistoryError('UninitializedHistory', 'history store is empty and initialBundle was not supplied')
  const validation = await validateBundle(initialBundle)
  if (!validation.ok) throw new HistoryError('InvalidBundle', 'initial history bundle failed canonical validation', { errors: validation.errors })
  const state = stateTemplate()
  const manifest = await store.commitBundle(initialBundle, { name: `${initialBundle.workspace.workspace_revision}.egir.json`, mediaType: 'application/json' })
  const revision = initialBundle.workspace.workspace_revision
  state.commits[revision] = {
    workspace_revision: revision,
    workspace_id: initialBundle.workspace.workspace_id,
    manifest_id: manifest.manifest_id,
    parents: clone(initialBundle.workspace.parents ?? []),
    reason: 'initial',
    created_at: initialBundle.workspace.created_at,
    authority: null,
  }
  const branchId = branch?.branchId ?? 'branch:main'
  state.branches[branchId] = branchRecord({ branchId, name: branch?.name ?? 'main', head: revision, createdFrom: null })
  await store.carrier.put(HISTORY_KEY, state)
  return new HistoryRepository(store, state)
}
