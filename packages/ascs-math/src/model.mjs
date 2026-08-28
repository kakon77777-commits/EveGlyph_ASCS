import { canonicalExactDecimal, validateApproximateNumber, validateIntegerLexical, validateRational } from './numeric.mjs'

const NODE_KINDS = new Set(['free-ref','bound-ref','integer','rational','decimal-exact','number-approx','apply','binder','sequence','matrix','piecewise','quantity','external-ref','hole'])
const RESULT_STATES = new Set(['defined','conditional','undefined','unresolved','unevaluated'])
const EVIDENCE_CLASSES = new Set(['assumed','computed','verified','proved','heuristic','external'])

const clone = (value) => structuredClone(value)
const lexical = (a, b) => a < b ? -1 : a > b ? 1 : 0
const error = (code, message, details = {}) => ({ code, message, ...details })
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const id = (v) => typeof v === 'string' && v.length > 0 && v.length <= 256

export function nodeReferences(node) {
  if (!node || typeof node !== 'object') return []
  switch (node.kind) {
    case 'apply': return Array.isArray(node.args) ? [...node.args] : []
    case 'binder': {
      const refs = []
      if (id(node.body)) refs.push(node.body)
      const limits = isObject(node.limits) ? node.limits : {}
      if (id(limits.lower)) refs.push(limits.lower)
      if (id(limits.upper)) refs.push(limits.upper)
      for (const binding of Array.isArray(node.bindings) ? node.bindings : []) {
        if (isObject(binding.domain) && Object.keys(binding.domain).length === 1 && id(binding.domain.node)) refs.push(binding.domain.node)
      }
      return refs
    }
    case 'sequence': return Array.isArray(node.items) ? [...node.items] : []
    case 'matrix': return Array.isArray(node.cells) ? node.cells.flatMap((row) => Array.isArray(row) ? row : []) : []
    case 'piecewise': {
      const refs = []
      for (const c of Array.isArray(node.cases) ? node.cases : []) {
        if (id(c?.condition)) refs.push(c.condition)
        if (id(c?.value)) refs.push(c.value)
      }
      if (id(node.otherwise)) refs.push(node.otherwise)
      return refs
    }
    case 'quantity': return id(node.value) ? [node.value] : []
    default: return []
  }
}

function sortBy(list, selector) { return [...(Array.isArray(list) ? list : [])].sort((a,b) => lexical(selector(a), selector(b))) }

export function canonicalizeNativeMathObject(value) {
  const out = clone(value)
  if (!isObject(out)) return out
  if (isObject(out.expression) && Array.isArray(out.expression.nodes)) out.expression.nodes = sortBy(out.expression.nodes, (n) => String(n?.id ?? ''))
  if (isObject(out.environment) && Array.isArray(out.environment.declarations)) out.environment.declarations = sortBy(out.environment.declarations, (d) => String(d?.declaration_id ?? ''))
  out.type_assertions = sortBy(out.type_assertions, (r) => `${r?.node ?? ''}\0${r?.status ?? ''}`)
  out.unit_assertions = sortBy(out.unit_assertions, (r) => String(r?.node ?? ''))
  out.assumptions = sortBy(out.assumptions, (r) => String(r?.assumption_id ?? ''))
  out.constraints = sortBy(out.constraints, (r) => String(r?.constraint_id ?? ''))
  out.evidence = sortBy(out.evidence, (r) => String(r?.evidence_id ?? ''))
  if (isObject(out.expression) && Array.isArray(out.expression.nodes)) {
    for (const n of out.expression.nodes) {
      if (n?.kind === 'rational') {
        const checked = validateRational({ numerator: n.numerator, denominator: n.denominator })
        if (checked.status === 'reject-noncanonical') Object.assign(n, checked.canonical_form)
      }
      if (n?.kind === 'decimal-exact') {
        try { Object.assign(n, canonicalExactDecimal(n.coefficient, n.exponent10)) } catch {}
      }
    }
  }
  return out
}

function basicNodeErrors(node) {
  const errors=[]
  if (!isObject(node) || !id(node.id) || !NODE_KINDS.has(node.kind)) return [error('InvalidNode','node must have a valid id and frozen node kind')]
  if (node.kind === 'integer' && validateIntegerLexical(node.value).status !== 'valid') errors.push(error('InvalidIntegerLexical',`invalid integer ${node.id}`))
  if (node.kind === 'rational') {
    const r=validateRational(node)
    if (r.status === 'reject') errors.push(error('InvalidRational',`invalid rational ${node.id}`))
    else if (r.status === 'reject-noncanonical') errors.push(error('NonCanonicalRational',`rational ${node.id} is not reduced`,{canonical_form:r.canonical_form}))
  }
  if (node.kind === 'decimal-exact') {
    if (validateIntegerLexical(node.coefficient).status !== 'valid' || validateIntegerLexical(node.exponent10).status !== 'valid') errors.push(error('InvalidExactDecimal',`invalid exact decimal ${node.id}`))
    else {
      const c=canonicalExactDecimal(node.coefficient,node.exponent10)
      if (c.coefficient !== node.coefficient || c.exponent10 !== node.exponent10) errors.push(error('NonCanonicalExactDecimal',`exact decimal ${node.id} is not canonical`,{canonical_form:c}))
    }
  }
  if (node.kind === 'number-approx' && validateApproximateNumber(node).status !== 'valid') errors.push(error('InvalidApproximateNumber',`approximate number ${node.id} lacks explicit precision metadata`))
  if (node.kind === 'apply' && (!isObject(node.operator) || !Array.isArray(node.args))) errors.push(error('InvalidApplyNode',`invalid apply ${node.id}`))
  if (node.kind === 'binder' && (!isObject(node.operator) || !Array.isArray(node.bindings) || node.bindings.length < 1 || !id(node.body))) errors.push(error('InvalidBinderNode',`invalid binder ${node.id}`))
  if (node.kind === 'matrix') {
    if (!Number.isInteger(node.rows) || node.rows < 0 || !Number.isInteger(node.columns) || node.columns < 0 || !Array.isArray(node.cells) || node.cells.length !== node.rows || node.cells.some((r)=>!Array.isArray(r)||r.length!==node.columns)) errors.push(error('InvalidMatrixShape',`matrix ${node.id} shape does not match cells`))
  }
  return errors
}

export function validateNativeMathObject(obj) {
  const errors=[]
  if (!isObject(obj)) return { ok:false, errors:[error('InvalidObject','Native Math candidate must be an object')] }
  const required=['profile','object_role','expression','environment','assumptions','constraints','type_assertions','unit_assertions','numeric_policy','presentation','evidence','result_state','execution','extensions']
  for (const key of required) if (!Object.hasOwn(obj,key)) errors.push(error('MissingField',`missing top-level field ${key}`,{field:key}))
  if (obj.profile !== 'ncm/1.0-candidate.1') errors.push(error('WrongProfile','Native Math candidate profile must be ncm/1.0-candidate.1'))
  if (!isObject(obj.expression) || !id(obj.expression.root) || !Array.isArray(obj.expression.nodes) || obj.expression.nodes.length < 1) return { ok:false, errors:[...errors,error('InvalidExpressionGraph','expression requires root and non-empty nodes')] }

  const nodes=obj.expression.nodes
  const ids=nodes.map((n)=>n?.id)
  for (const n of nodes) errors.push(...basicNodeErrors(n))
  if (new Set(ids).size !== ids.length) errors.push(error('DuplicateNodeId','expression node IDs must be unique'))
  if (JSON.stringify(ids) !== JSON.stringify([...ids].sort(lexical))) errors.push(error('NonCanonicalNodeOrder','expression.nodes must be sorted lexically by id'))
  const byId=new Map(nodes.filter((n)=>id(n?.id)).map((n)=>[n.id,n]))
  if (!byId.has(obj.expression.root)) errors.push(error('MissingRoot','expression root does not exist'))
  for (const n of nodes) for (const ref of nodeReferences(n)) if (!byId.has(ref)) errors.push(error('MissingNodeReference',`node ${n.id} references missing node ${ref}`,{node:n.id,ref}))

  const declarations=Array.isArray(obj.environment?.declarations)?obj.environment.declarations:[]
  const declarationIds=declarations.map((d)=>d?.declaration_id)
  if (new Set(declarationIds).size !== declarationIds.length) errors.push(error('DuplicateDeclarationId','declaration IDs must be unique'))
  if (JSON.stringify(declarationIds)!==JSON.stringify([...declarationIds].sort(lexical))) errors.push(error('NonCanonicalDeclarationOrder','environment.declarations must be sorted lexically'))
  const declSet=new Set(declarationIds)
  for (const n of nodes) if (n?.kind==='free-ref'&&!declSet.has(n.declaration_id)) errors.push(error('UnknownDeclaration',`free-ref ${n.id} has unknown declaration ${n.declaration_id}`,{node:n.id}))

  // Expression-cycle and reachability validation is identity/edge based, independent of binding scope.
  const reachable=new Set(), visiting=new Set(), done=new Set()
  const graphWalk=(nid)=>{
    if (!byId.has(nid)||done.has(nid)) return
    if (visiting.has(nid)) { errors.push(error('ExpressionCycle',`expression cycle detected at ${nid}`,{node:nid})); return }
    visiting.add(nid); reachable.add(nid)
    for (const ref of nodeReferences(byId.get(nid))) graphWalk(ref)
    visiting.delete(nid); done.add(nid)
  }
  if (byId.has(obj.expression.root)) graphWalk(obj.expression.root)
  for (const nid of ids) if (!reachable.has(nid)) errors.push(error('UnreachableNode',`unreachable canonical node ${nid}`,{node:nid}))

  // Bound references are validated against the enclosing binder scope. Limits and domain-node refs are outside the new slot scope.
  const scopeSeen=new Set()
  const scopeWalk=(nid,active)=>{
    const key=`${nid}\0${active.join('\0')}`
    if (!byId.has(nid)||scopeSeen.has(key)) return
    scopeSeen.add(key)
    const n=byId.get(nid)
    if (n.kind==='bound-ref') {
      if (!active.includes(n.binding_id)) errors.push(error('BoundRefOutOfScope',`bound-ref ${nid} is outside binding scope ${n.binding_id}`,{node:nid,binding_id:n.binding_id}))
      return
    }
    if (n.kind==='binder') {
      const bindings=Array.isArray(n.bindings)?n.bindings:[]
      const bindingIds=bindings.map((b)=>b?.binding_id)
      if (new Set(bindingIds).size!==bindingIds.length) errors.push(error('DuplicateBindingId',`binder ${nid} has duplicate binding IDs`,{node:nid}))
      const limits=isObject(n.limits)?n.limits:{}
      if (id(limits.lower)) scopeWalk(limits.lower,active)
      if (id(limits.upper)) scopeWalk(limits.upper,active)
      for (const b of bindings) if (isObject(b?.domain)&&Object.keys(b.domain).length===1&&id(b.domain.node)) scopeWalk(b.domain.node,active)
      if (id(n.body)) scopeWalk(n.body,[...active,...bindingIds.filter(id)])
      return
    }
    for (const ref of nodeReferences(n)) scopeWalk(ref,active)
  }
  if (byId.has(obj.expression.root)&&!errors.some((e)=>e.code==='ExpressionCycle')) scopeWalk(obj.expression.root,[])

  const recordGroups=[
    ['assumption',obj.assumptions,'assumption_id'],['constraint',obj.constraints,'constraint_id'],['evidence',obj.evidence,'evidence_id'],
  ]
  for (const [label,list,key] of recordGroups) {
    const values=Array.isArray(list)?list:[]; const keys=values.map((r)=>r?.[key])
    if (new Set(keys).size!==keys.length) errors.push(error(`Duplicate${label[0].toUpperCase()+label.slice(1)}Id`,`${label} IDs must be unique`))
    if (JSON.stringify(keys)!==JSON.stringify([...keys].sort(lexical))) errors.push(error('NonCanonicalRecordOrder',`${label} records must be sorted lexically`,{record_type:label}))
  }
  const evSet=new Set((Array.isArray(obj.evidence)?obj.evidence:[]).map((e)=>e?.evidence_id))
  for (const a of Array.isArray(obj.assumptions)?obj.assumptions:[]) if (!byId.has(a.expression_root)) errors.push(error('MissingAssumptionRoot',`assumption ${a.assumption_id} root missing`))
  for (const c of Array.isArray(obj.constraints)?obj.constraints:[]) {
    if (!byId.has(c.expression_root)) errors.push(error('MissingConstraintRoot',`constraint ${c.constraint_id} root missing`))
    if (c.status==='discharged'&&!evSet.has(c.evidence_ref)) errors.push(error('DischargedConstraintEvidenceRequired',`discharged constraint ${c.constraint_id} requires evidence_ref`))
  }
  for (const ev of Array.isArray(obj.evidence)?obj.evidence:[]) {
    if (!EVIDENCE_CLASSES.has(ev?.class)) errors.push(error('InvalidEvidenceClass',`invalid evidence class ${ev?.class}`))
    if (ev?.class==='proved'&&ev.certificate_ref==null) errors.push(error('ProofCertificateRequired',`proved evidence ${ev.evidence_id} requires certificate_ref`))
    for (const cond of Array.isArray(ev?.conditions)?ev.conditions:[]) if (!byId.has(cond)) errors.push(error('MissingEvidenceCondition',`evidence ${ev.evidence_id} condition node missing: ${cond}`))
  }
  const typeAssertions=Array.isArray(obj.type_assertions)?obj.type_assertions:[]
  const typeKeys=typeAssertions.map((t)=>`${t?.node ?? ''}\0${t?.status ?? ''}`)
  if (JSON.stringify(typeKeys)!==JSON.stringify([...typeKeys].sort(lexical))) errors.push(error('NonCanonicalTypeAssertionOrder','type assertions must be sorted by (node,status)'))
  for (const t of typeAssertions) {
    if (!byId.has(t.node)) errors.push(error('MissingTypeAssertionNode',`type assertion references missing node ${t.node}`))
    if (t.status==='verified'&&!evSet.has(t.evidence_ref)) errors.push(error('VerifiedTypeEvidenceRequired',`verified type assertion on ${t.node} requires evidence_ref`))
  }
  const unitAssertions=Array.isArray(obj.unit_assertions)?obj.unit_assertions:[]
  const unitKeys=unitAssertions.map((u)=>u?.node)
  if (JSON.stringify(unitKeys)!==JSON.stringify([...unitKeys].sort(lexical))) errors.push(error('NonCanonicalUnitAssertionOrder','unit assertions must be sorted by node'))
  for (const u of unitAssertions) {
    if (!byId.has(u.node)) errors.push(error('MissingUnitAssertionNode',`unit assertion references missing node ${u.node}`))
    if (u.status==='verified'&&!evSet.has(u.evidence_ref)) errors.push(error('VerifiedUnitEvidenceRequired',`verified unit assertion on ${u.node} requires evidence_ref`))
  }
  const rs=obj.result_state
  if (!isObject(rs)||!RESULT_STATES.has(rs.status)) errors.push(error('InvalidResultState','invalid result_state status'))
  else {
    if (rs.value_root!=null&&!byId.has(rs.value_root)) errors.push(error('MissingResultValueRoot','result_state.value_root references missing node'))
    for (const c of Array.isArray(rs.condition_roots)?rs.condition_roots:[]) if (!byId.has(c)) errors.push(error('MissingResultCondition',`result_state condition node missing: ${c}`))
  }
  return { ok:errors.length===0, errors }
}
