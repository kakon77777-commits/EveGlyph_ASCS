function gcd(a, b) {
  a = a < 0n ? -a : a; b = b < 0n ? -b : b
  while (b) [a, b] = [b, a % b]
  return a || 1n
}

class Rat {
  constructor(n, d = 1n) {
    if (d === 0n) throw new RangeError('zero rational denominator')
    if (d < 0n) { n = -n; d = -d }
    const g = gcd(n, d)
    this.n = n / g; this.d = d / g
  }
  add(o) { o = rat(o); return new Rat(this.n * o.d + o.n * this.d, this.d * o.d) }
  sub(o) { o = rat(o); return new Rat(this.n * o.d - o.n * this.d, this.d * o.d) }
  mul(o) { o = rat(o); return new Rat(this.n * o.n, this.d * o.d) }
  div(o) { o = rat(o); if (o.n === 0n) throw new RangeError('division by zero'); return new Rat(this.n * o.d, this.d * o.n) }
  neg() { return new Rat(-this.n, this.d) }
  eq(o) { o = rat(o); return this.n === o.n && this.d === o.d }
}

function rat(value) {
  if (value instanceof Rat) return value
  if (typeof value === 'bigint') return new Rat(value)
  const text = String(value)
  const frac = text.match(/^(-?\d+)\/(\d+)$/)
  if (frac) return new Rat(BigInt(frac[1]), BigInt(frac[2]))
  const m = text.match(/^(-?)(\d+)(?:\.(\d+))?$/)
  if (!m) throw new TypeError(`invalid finite decimal: ${text}`)
  const sign = m[1] === '-' ? -1n : 1n
  const digits = m[3] ?? ''
  const denom = 10n ** BigInt(digits.length)
  return new Rat(sign * BigInt(m[2] + digits), denom)
}

function finiteDecimal(r) {
  r = rat(r)
  let d = r.d
  let twos = 0; let fives = 0
  while (d % 2n === 0n) { d /= 2n; twos++ }
  while (d % 5n === 0n) { d /= 5n; fives++ }
  if (d !== 1n) throw new RangeError('non-finite decimal affine result')
  const scale = Math.max(twos, fives)
  let n = r.n
  if (twos < scale) n *= 2n ** BigInt(scale - twos)
  if (fives < scale) n *= 5n ** BigInt(scale - fives)
  const sign = n < 0n ? '-' : ''
  let digits = (n < 0n ? -n : n).toString()
  if (scale === 0) return sign + digits
  digits = digits.padStart(scale + 1, '0')
  const whole = digits.slice(0, -scale)
  let frac = digits.slice(-scale).replace(/0+$/, '')
  return sign + whole + (frac ? `.${frac}` : '')
}

const INTERNAL = Symbol('rational-affine')
function internal(values) { return { [INTERNAL]: true, values } }
function matrixR(m) {
  if (m?.[INTERNAL]) return m.values.map(rat)
  if (!Array.isArray(m) || m.length !== 6) throw new TypeError('affine matrix must have six values')
  return m.map(rat)
}
function external(values) { return values.map(finiteDecimal) }

export function identityAffine(options = {}) {
  const [x, y] = options.translation ?? ['0', '0']
  return ['1', '0', '0', '1', String(x), String(y)].map((v) => finiteDecimal(rat(v)))
}
export function translationAffine(x, y) { return identityAffine({ translation: [x, y] }) }

export function composeAffine(left, right) {
  const [a1,b1,c1,d1,e1,f1] = matrixR(left)
  const [a2,b2,c2,d2,e2,f2] = matrixR(right)
  const out = [
    a1.mul(a2).add(c1.mul(b2)),
    b1.mul(a2).add(d1.mul(b2)),
    a1.mul(c2).add(c1.mul(d2)),
    b1.mul(c2).add(d1.mul(d2)),
    a1.mul(e2).add(c1.mul(f2)).add(e1),
    b1.mul(e2).add(d1.mul(f2)).add(f1),
  ]
  try { return external(out) } catch { return internal(out) }
}

export function invertAffine(matrix) {
  const [a,b,c,d,e,f] = matrixR(matrix)
  const det = a.mul(d).sub(b.mul(c))
  if (det.n === 0n) throw new RangeError('non-invertible affine transform')
  const ia = d.div(det), ib = b.neg().div(det), ic = c.neg().div(det), id = a.div(det)
  const ie = ia.mul(e).add(ic.mul(f)).neg()
  const iff = ib.mul(e).add(id.mul(f)).neg()
  return internal([ia, ib, ic, id, ie, iff])
}

export function translationOf(matrix) {
  const m = matrixR(matrix)
  return [finiteDecimal(m[4]), finiteDecimal(m[5])]
}

function pair(value) {
  if (!Array.isArray(value) || value.length !== 2) throw new TypeError('translation must have two values')
  return value.map(rat)
}
function addPair(a, b) { a=pair(a); b=pair(b); return [finiteDecimal(a[0].add(b[0])), finiteDecimal(a[1].add(b[1]))] }
function subPair(a, b) { a=pair(a); b=pair(b); return [finiteDecimal(a[0].sub(b[0])), finiteDecimal(a[1].sub(b[1]))] }

export function applyViewTransform(workspaceRevision) { return { workspace_revision: workspaceRevision, canonical_mutation: false } }
export function reparentTranslationKeepWorld(oldWorld, newParentWorld) { return { new_local_translation: subPair(oldWorld, newParentWorld), world_preserved: true } }
export function reparentTranslationKeepLocal(oldLocal, newParentWorld) { return { new_local_translation: oldLocal.map(String), world_translation: addPair(newParentWorld, oldLocal) } }

export function validateRegionForest(parents) {
  const map = parents instanceof Map ? parents : new Map(Object.entries(parents ?? {}))
  const visiting = new Set(); const done = new Set()
  function visit(id) {
    if (done.has(id)) return false
    if (visiting.has(id)) return true
    visiting.add(id)
    const parent = map.get(id)
    if (parent != null && map.has(parent) && visit(parent)) return true
    visiting.delete(id); done.add(id); return false
  }
  for (const id of map.keys()) if (visit(id)) return { status: 'RegionCycleConflict', committed: false }
  return { status: 'Resolved', committed: true }
}

export function moveParentTranslation(childLocal, parentWorldAfter) { return { child_local: childLocal.map(String), child_world_after: addPair(parentWorldAfter, childLocal) } }
export function semanticZoomProjection(input) { return { object_id: input.object_id, content: input.content, execution_graph_changed: false } }

export function resolvePolicyValue(values, mode = 'override-nearest') {
  const filtered = values.filter((x) => x != null)
  if (mode === 'deny-dominates' && filtered.includes('deny')) return 'deny'
  if (mode === 'merge-set') return [...new Set(filtered.flatMap((x) => Array.isArray(x) ? x : [x]))]
  if (mode === 'intersect-capability') {
    const sets = filtered.map((x) => new Set(Array.isArray(x) ? x : [x]))
    if (!sets.length) return []
    return [...sets[0]].filter((x) => sets.every((set) => set.has(x)))
  }
  return filtered.at(-1) ?? null
}

export function resolveGrammar({ ancestor, child, childMode }) { return childMode === 'explicit' && child ? child : ancestor }

export function spatialParseCandidate(input) {
  if (input.derived_candidate != null) return { explicit_relation_created: false, authority: 'candidate' }
  if (input.A_region != null && input.B_region != null && input.A_region !== input.B_region) return { candidate_created: false }
  return { candidate_created: true, authority: 'candidate' }
}
export function commitExplicitCrossRegionRelation(input) { return { committed: Boolean(input.relation), survives_region_move: Boolean(input.relation) } }
export function classifyReparentMutation(input) { return { object_content: input.object_content, object_revision: input.object_revision, workspace_revision_changed: true } }

function eqPair(a,b) { return JSON.stringify(a) === JSON.stringify(b) }
export function mergePlacement(base, left, right) {
  const lc=!eqPair(base,left), rc=!eqPair(base,right)
  if (lc && rc && !eqPair(left,right)) return { status: 'SpatialPlacementConflict' }
  return { status: 'Merged', placement: lc ? left : right }
}
export function mergeSpatialChannels(left, right) {
  const independent = new Set([left,right])
  return independent.has('intrinsic-edit') && independent.has('parent-region-move') ? { status: 'Merged', preserve_both: true } : { status: 'Conflict', preserve_both: false }
}
export function mergeRegionLifecycle(left, right) {
  if (new Set([left,right]).has('delete-region') && new Set([left,right]).has('edit-child')) return { status: 'DeleteVsDescendantEditConflict' }
  return { status: 'Merged' }
}
export function collapseRegionProjection(workspaceRevision) { return { workspace_revision: workspaceRevision, canonical_mutation: false } }
export function compileCrossRegion(input) {
  if (input.source_region !== input.target_region && !input.has_export_port) return { status: 'ExecutionBoundaryViolation', compiled: false }
  return { status: 'Compiled', compiled: true }
}

function clone(value) { return structuredClone(value) }

export class SpatialError extends Error {
  constructor(code, message) { super(message); this.name='SpatialError'; this.code=code }
}

export class SpatialModel {
  constructor({ regions = [], nodes = [] } = {}) {
    this._regions = new Map()
    this._nodes = new Map()
    for (const region of regions) this._regions.set(region.id, { id: region.id, parent: region.parent ?? null, localToParent: clone(region.localToParent ?? identityAffine()) })
    const check = validateRegionForest(new Map([...this._regions].map(([id,r]) => [id,r.parent])))
    if (!check.committed) throw new SpatialError('RegionCycleConflict', 'region parent graph contains a cycle')
    for (const node of nodes) this._nodes.set(node.id, { id: node.id, parentRegion: node.parentRegion ?? null, localToParent: clone(node.localToParent ?? identityAffine()) })
  }
  region(id) { const r=this._regions.get(id); if (!r) throw new SpatialError('UnknownRegion', `unknown region ${id}`); return clone(r) }
  node(id) { const n=this._nodes.get(id); if (!n) throw new SpatialError('UnknownNode', `unknown node ${id}`); return clone(n) }
  _regionWorld(id, stack = new Set()) {
    if (id == null) return identityAffine()
    if (stack.has(id)) throw new SpatialError('RegionCycleConflict', 'region cycle during world transform')
    const region=this._regions.get(id); if (!region) throw new SpatialError('UnknownRegion', `unknown region ${id}`)
    stack.add(id)
    const parent=this._regionWorld(region.parent, stack)
    stack.delete(id)
    return composeAffine(parent, region.localToParent)
  }
  worldTransform(id) {
    if (this._regions.has(id)) return this._regionWorld(id)
    const node=this._nodes.get(id); if (!node) throw new SpatialError('UnknownNode', `unknown node ${id}`)
    return composeAffine(this._regionWorld(node.parentRegion), node.localToParent)
  }
  setRegionParent(id, parent) {
    const region=this._regions.get(id); if (!region) throw new SpatialError('UnknownRegion', `unknown region ${id}`)
    if (parent != null && !this._regions.has(parent)) throw new SpatialError('UnknownRegion', `unknown parent region ${parent}`)
    const parents=new Map([...this._regions].map(([rid,r]) => [rid, rid===id ? parent : r.parent]))
    const check=validateRegionForest(parents)
    if (!check.committed) throw new SpatialError('RegionCycleConflict', 'region parent graph contains a cycle')
    region.parent=parent
    return this.region(id)
  }
  reparentNode(id, parentRegion, { mode = 'keep-world' } = {}) {
    const node=this._nodes.get(id); if (!node) throw new SpatialError('UnknownNode', `unknown node ${id}`)
    if (parentRegion != null && !this._regions.has(parentRegion)) throw new SpatialError('UnknownRegion', `unknown parent region ${parentRegion}`)
    if (mode === 'keep-world') {
      const oldWorld=this.worldTransform(id)
      const parentWorld=this._regionWorld(parentRegion)
      node.localToParent=external(matrixR(composeAffine(invertAffine(parentWorld), oldWorld)))
    } else if (mode !== 'keep-local') throw new TypeError(`unknown reparent mode ${mode}`)
    node.parentRegion=parentRegion
    return this.node(id)
  }
}

export function createSpatialModel(options) { return new SpatialModel(options) }
