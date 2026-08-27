import { createWorkspaceRuntime } from '../../../../packages/ascs-runtime/src/index.mjs'
import { validateBundle } from '../../../../packages/ascs-core/src/index.mjs'

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
