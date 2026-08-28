const MAP_STATUSES = new Set(['mapped','split','merged','deleted','ambiguous','unmapped'])
const FIDELITY_VALUES = new Set(['exact','preserved-subset','approximated','dropped','unknown','not-applicable'])

export function validateMathSubaddress(address,currentRevision) {
  const same=Boolean(address&&typeof address.revision==='string'&&address.revision===currentRevision)
  return { direct_reuse_allowed:same, mapping_required:!same }
}

export function createNodeMapEntry({ from,status,to=[] }) {
  if (typeof from!=='string'||!from||!MAP_STATUSES.has(status)||!Array.isArray(to)||to.some((x)=>typeof x!=='string'||!x)) throw new TypeError('invalid math node-map entry')
  if (status==='deleted'&&to.length!==0) throw new TypeError('deleted node map must have empty target list')
  return { from,status,to:[...to] }
}

function semanticRefOk(r) { return r&&['namespace','theory','name','version'].every((k)=>typeof r[k]==='string'&&r[k].length>0) }
function subaddressOk(a) { return a&&typeof a.revision==='string'&&a.revision&&typeof a.node==='string'&&a.node }

export function validateTransformRecord(record) {
  const errors=[]
  if (!record||record.profile!=='org.evemisslab.math-transform/0.1'||record.record_type!=='transform') errors.push('profile/record_type')
  if (typeof record?.transform_id!=='string'||!record.transform_id) errors.push('transform_id')
  if (!subaddressOk(record?.input)||!subaddressOk(record?.output)) errors.push('subaddress')
  if (!semanticRefOk(record?.rule)) errors.push('rule')
  if (!Array.isArray(record?.conditions)) errors.push('conditions')
  if (!new Set(['computed','verified','proved','heuristic','external']).has(record?.evidence_class)) errors.push('evidence_class')
  if (!record?.backend||typeof record.backend.name!=='string'||typeof record.backend.version!=='string') errors.push('backend')
  if (!Array.isArray(record?.node_map)) errors.push('node_map')
  else for (const item of record.node_map) { try { createNodeMapEntry(item) } catch { errors.push('node_map_entry') } }
  return { ok:errors.length===0, errors }
}

export function validateAdapterFidelity(record) {
  const errors=[]
  if (!record||record.profile!=='org.evemisslab.math-adapter-fidelity/0.1'||record.record_type!=='adapter-fidelity') errors.push('profile/record_type')
  if (typeof record?.adapter!=='string'||!record.adapter) errors.push('adapter')
  for (const key of ['semantics','binding','conditions','presentation','provenance']) if (!FIDELITY_VALUES.has(record?.[key])) errors.push(key)
  return { ok:errors.length===0, errors }
}

export const NODE_MAP_STATUSES = Object.freeze([...MAP_STATUSES])
export const ADAPTER_FIDELITY_VALUES = Object.freeze([...FIDELITY_VALUES])
