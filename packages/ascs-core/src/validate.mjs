import { contentAddress, revisionAddress, workspaceRevisionAddress } from './canonical.mjs'

function issue(code, path, detail) {
  return { code, ...(path ? { path } : {}), ...(detail ? { detail } : {}) }
}

export async function validateBundle(bundle) {
  const errors = []
  if (!bundle || typeof bundle !== 'object') {
    return { ok: false, errors: [issue('InvalidBundle', '', 'bundle must be an object')] }
  }

  const objects = new Map()
  const revisions = new Map()

  for (const [i, object] of (bundle.object_records || []).entries()) {
    if (objects.has(object.persistent_id)) errors.push(issue('DuplicateObjectId', `object_records[${i}].persistent_id`))
    else objects.set(object.persistent_id, object)
  }

  for (const [i, revision] of (bundle.revision_records || []).entries()) {
    if (revisions.has(revision.revision_id)) errors.push(issue('DuplicateRevisionId', `revision_records[${i}].revision_id`))
    else revisions.set(revision.revision_id, revision)
  }

  for (const [i, object] of (bundle.object_records || []).entries()) {
    for (const [branch, rid] of Object.entries(object.heads || {})) {
      const revision = revisions.get(rid)
      if (!revision) errors.push(issue('MissingHeadRevision', `object_records[${i}].heads.${branch}`, rid))
      else if (revision.persistent_id !== object.persistent_id) errors.push(issue('HeadLineageMismatch', `object_records[${i}].heads.${branch}`, rid))
    }
  }

  for (const [i, revision] of (bundle.revision_records || []).entries()) {
    if (!objects.has(revision.persistent_id)) errors.push(issue('MissingObject', `revision_records[${i}].persistent_id`, revision.persistent_id))
    for (const [j, parent] of (revision.parents || []).entries()) {
      if (!revisions.has(parent)) errors.push(issue('MissingParentRevision', `revision_records[${i}].parents[${j}]`, parent))
    }
    try {
      const expectedContent = await contentAddress(revision.kind, revision.intrinsic)
      if (expectedContent !== revision.content_address) errors.push(issue('ContentAddressMismatch', `revision_records[${i}].content_address`, `${expectedContent} != ${revision.content_address}`))
      const expectedRevision = await revisionAddress(revision)
      if (expectedRevision !== revision.revision_id) errors.push(issue('RevisionAddressMismatch', `revision_records[${i}].revision_id`, `${expectedRevision} != ${revision.revision_id}`))
    } catch (error) {
      errors.push(issue('CanonicalizationError', `revision_records[${i}]`, String(error.message || error)))
    }
  }

  const workspace = bundle.workspace
  if (!workspace) {
    errors.push(issue('MissingWorkspace'))
  } else {
    for (const [group, heads] of [['object_heads', workspace.object_heads || []], ['relation_heads', workspace.relation_heads || []]]) {
      for (const [i, head] of heads.entries()) {
        if (!objects.has(head.persistent_id) || !revisions.has(head.revision)) errors.push(issue('WorkspaceHeadReferenceMissing', `workspace.${group}[${i}]`))
        else if (revisions.get(head.revision).persistent_id !== head.persistent_id) errors.push(issue('WorkspaceHeadLineageMismatch', `workspace.${group}[${i}]`))
      }
    }
    for (const [i, placement] of (workspace.placements || []).entries()) {
      if (!objects.has(placement.object_id)) errors.push(issue('PlacementObjectMissing', `workspace.placements[${i}].object_id`, placement.object_id))
    }
    try {
      const expected = await workspaceRevisionAddress(workspace)
      if (expected !== workspace.workspace_revision) errors.push(issue('WorkspaceRevisionMismatch', 'workspace.workspace_revision', `${expected} != ${workspace.workspace_revision}`))
    } catch (error) {
      errors.push(issue('CanonicalizationError', 'workspace', String(error.message || error)))
    }
  }

  return { ok: errors.length === 0, errors }
}
