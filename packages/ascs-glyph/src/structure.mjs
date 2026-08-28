function sortedUnique(values) {
  return values.length === new Set(values).size && values.join('\0') === [...values].sort().join('\0')
}

export function validateTopology(glyph) {
  const errors = []
  const pathIds = new Set((glyph?.geometry?.paths ?? []).map((p) => p.path_id))
  const componentIds = new Set((glyph?.geometry?.components ?? []).map((c) => c.component_id))
  const geometryRefs = new Set([...pathIds, ...componentIds])
  const components = glyph?.topology?.components ?? []
  const ids = components.map((c) => c.component_id)
  if (!sortedUnique(ids)) errors.push('topology component IDs must be unique and sorted')
  const idSet = new Set(ids)
  const holes = glyph?.topology?.holes ?? []
  const holeIds = holes.map((h) => h.hole_id)
  if (!sortedUnique(holeIds)) errors.push('topology hole IDs must be unique and sorted')
  const holeSet = new Set(holeIds)
  for (const component of components) {
    for (const ref of component.geometry_refs ?? []) if (!geometryRefs.has(ref)) errors.push(`topology component ${component.component_id} has dangling geometry ref ${ref}`)
    for (const holeId of component.hole_ids ?? []) if (!holeSet.has(holeId)) errors.push(`topology component ${component.component_id} has missing hole ${holeId}`)
  }
  for (const hole of holes) {
    if (!idSet.has(hole.owner_component)) errors.push(`hole ${hole.hole_id} owner missing`)
    if (hole.boundary_ref != null && !geometryRefs.has(hole.boundary_ref)) errors.push(`hole ${hole.hole_id} boundary ref missing`)
  }
  for (const edge of glyph?.topology?.adjacency ?? []) if (!idSet.has(edge.source) || !idSet.has(edge.target)) errors.push('topology adjacency has missing endpoint')
  return { ok: errors.length === 0, errors, authority: 'committed-topology' }
}

export function validatePartGraph(glyph) {
  const errors = []
  const geometryRefs = new Set([
    ...(glyph?.geometry?.paths ?? []).map((p) => p.path_id),
    ...(glyph?.geometry?.components ?? []).map((c) => c.component_id),
  ])
  const nodes = glyph?.parts?.nodes ?? []
  const ids = nodes.map((n) => n.part_id)
  if (!sortedUnique(ids)) errors.push('part IDs must be unique and sorted')
  const idSet = new Set(ids)
  for (const node of nodes) for (const ref of node.geometry_refs ?? []) if (!geometryRefs.has(ref)) errors.push(`part ${node.part_id} has dangling geometry ref ${ref}`)
  for (const edge of glyph?.parts?.edges ?? []) if (!idSet.has(edge.source) || !idSet.has(edge.target)) errors.push('part edge has missing endpoint')
  const ports = glyph?.parts?.ports ?? []
  const portIds = ports.map((p) => p.port_id)
  if (portIds.length !== new Set(portIds).size) errors.push('port IDs must be unique')
  return { ok: errors.length === 0, errors, semantic_authority: false }
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
  return value
}
function eq(a, b) { return JSON.stringify(stable(a)) === JSON.stringify(stable(b)) }

export function classifyGlyphEquality(a, b, { semanticBindingsA = [], semanticBindingsB = [], familyA = null, familyB = null } = {}) {
  return Object.freeze({
    persistent_identity: false,
    carry_equal: eq(a?.geometry?.exact_carries ?? [], b?.geometry?.exact_carries ?? []),
    geometry_equal: eq(a?.geometry ?? null, b?.geometry ?? null),
    topology_equal: eq(a?.topology ?? null, b?.topology ?? null),
    part_equal: eq(a?.parts ?? null, b?.parts ?? null),
    family_equal: eq(familyA, familyB),
    semantic_equal: eq(semanticBindingsA, semanticBindingsB),
    equality_family: 'typed-not-identity',
  })
}

export function semanticZoomProjectionIdentity(glyphRef, z1, z2) {
  return Object.freeze({ glyph_ref: structuredClone(glyphRef), from_zoom: z1, to_zoom: z2, same_identity: true, authority: 'projection-only' })
}
