import { createWorkspaceRuntime } from '../../../../packages/ascs-runtime/src/index.mjs'
import { validateBundle } from '../../../../packages/ascs-core/src/index.mjs'
import {
  createEgStore,
  createMemoryCarrier,
  createOpfsCarrier,
} from '../../../../packages/ascs-store/src/index.mjs'
import { createHistoryRepository as createRawHistoryRepository } from '../../../../packages/ascs-history/src/index.mjs'
import { createSpatialModel as createRawSpatialModel } from '../../../../packages/ascs-spatial/src/index.mjs'

async function createConfiguredCarrier(persistence = { kind: 'memory' }) {
  const config = persistence ?? { kind: 'memory' }
  if (config.kind === 'memory') return createMemoryCarrier()
  if (config.kind === 'opfs') {
    return createOpfsCarrier({
      prefix: config.prefix,
      navigatorObject: config.navigatorObject,
    })
  }
  throw new TypeError(`unsupported ASCS persistence carrier: ${String(config.kind)}`)
}

function createHistoryFacade(repository, durabilityClass) {
  return Object.freeze({
    durabilityClass,
    branch(branchId) {
      return repository.branch(branchId)
    },
    renameBranch(branchId, name) {
      return repository.renameBranch(branchId, name)
    },
    archiveBranch(branchId) {
      return repository.archiveBranch(branchId)
    },
    forkBranch(options) {
      return repository.forkBranch(options)
    },
    checkpoint(bundle, options) {
      return repository.checkpoint(bundle, options)
    },
    explainHistory(workspaceRevision) {
      return repository.explainHistory(workspaceRevision)
    },
    loadSnapshot(workspaceRevision) {
      return repository.loadSnapshot(workspaceRevision)
    },
    autosaveRecovery(capsule) {
      return repository.autosaveRecovery(capsule)
    },
    recoveryDecision(sessionId, currentHead) {
      return repository.recoveryDecision(sessionId, currentHead)
    },
    planMerge(options) {
      return repository.planMerge(options)
    },
    commitMerge(options) {
      return repository.commitMerge(options)
    },
    revert(options) {
      return repository.revert(options)
    },
  })
}

export async function createCanonicalWorkspaceBridge(bundle, options = {}) {
  const runtime = await createWorkspaceRuntime(bundle, options)

  return Object.freeze({
    get workspaceRevision() {
      return runtime.workspaceRevision
    },
    snapshot() {
      return runtime.snapshot()
    },
    validate() {
      return validateBundle(runtime.snapshot())
    },
    objectHead(persistentId, branch = 'main') {
      return runtime.objectHead(persistentId, branch)
    },
    revision(revisionId) {
      return runtime.revision(revisionId)
    },
    placementFor(persistentId) {
      return runtime.placementFor(persistentId)
    },
    moveObject(persistentId, options) {
      return runtime.moveObject(persistentId, options)
    },
    tryMoveObject(persistentId, options) {
      return runtime.tryMoveObject(persistentId, options)
    },
    editIntrinsic(persistentId, options) {
      return runtime.editIntrinsic(persistentId, options)
    },
    cloneObject(persistentId, options) {
      return runtime.cloneObject(persistentId, options)
    },
  })
}

export async function createHistoryRepository({ initialBundle = null, persistence = { kind: 'memory' }, branch = null } = {}) {
  const carrier = await createConfiguredCarrier(persistence)
  const store = createEgStore(carrier)
  const repository = await createRawHistoryRepository({ store, initialBundle, branch })
  return createHistoryFacade(repository, store.durabilityClass)
}

export async function createPersistentWorkspace(bundle, options = {}) {
  const carrier = await createConfiguredCarrier(options.persistence)
  const store = createEgStore(carrier)
  const repository = await createRawHistoryRepository({
    store,
    initialBundle: bundle,
    branch: options.branch ?? { branchId: 'branch:main', name: 'main' },
  })
  let runtime = await createWorkspaceRuntime(bundle, options.runtimeOptions ?? {})

  async function resetRuntime(workspaceRevision) {
    const next = await repository.loadSnapshot(workspaceRevision)
    runtime = await createWorkspaceRuntime(next, options.runtimeOptions ?? {})
  }

  return Object.freeze({
    durabilityClass: store.durabilityClass,
    get workspaceRevision() {
      return runtime.workspaceRevision
    },
    snapshot() {
      return runtime.snapshot()
    },
    validate() {
      return validateBundle(runtime.snapshot())
    },
    branch(branchId) {
      return repository.branch(branchId)
    },
    renameBranch(branchId, name) {
      return repository.renameBranch(branchId, name)
    },
    archiveBranch(branchId) {
      return repository.archiveBranch(branchId)
    },
    forkBranch(options) {
      return repository.forkBranch(options)
    },
    objectHead(persistentId, branch = 'main') {
      return runtime.objectHead(persistentId, branch)
    },
    revision(revisionId) {
      return runtime.revision(revisionId)
    },
    placementFor(persistentId) {
      return runtime.placementFor(persistentId)
    },
    moveObject(persistentId, command) {
      return runtime.moveObject(persistentId, command)
    },
    tryMoveObject(persistentId, command) {
      return runtime.tryMoveObject(persistentId, command)
    },
    editIntrinsic(persistentId, command) {
      return runtime.editIntrinsic(persistentId, command)
    },
    cloneObject(persistentId, command) {
      return runtime.cloneObject(persistentId, command)
    },
    async checkpoint({ branchId = 'branch:main', authority, reason = 'checkpoint' } = {}) {
      const expectedHead = repository.branch(branchId).head
      return repository.checkpoint(runtime.snapshot(), { branchId, expectedHead, authority, reason })
    },
    explainHistory(workspaceRevision) {
      return repository.explainHistory(workspaceRevision)
    },
    loadSnapshot(workspaceRevision) {
      return repository.loadSnapshot(workspaceRevision)
    },
    autosaveRecovery(capsule) {
      return repository.autosaveRecovery(capsule)
    },
    recoveryDecision(sessionId, currentHead = runtime.workspaceRevision) {
      return repository.recoveryDecision(sessionId, currentHead)
    },
    planMerge(options) {
      return repository.planMerge(options)
    },
    async commitMerge(command) {
      const commit = await repository.commitMerge(command)
      await resetRuntime(commit.workspace_revision)
      return commit
    },
    async revert(command) {
      const commit = await repository.revert(command)
      await resetRuntime(commit.workspace_revision)
      return commit
    },
  })
}

export function createSpatialModel(options) {
  return createRawSpatialModel(options)
}
