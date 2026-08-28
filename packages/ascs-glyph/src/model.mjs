import { validGlyphScalar } from './scalar.mjs'
import { validateGlyphPath, validateExactCarry, validateComponentGraph } from './geometry.mjs'
import { validateTopology, validatePartGraph } from './structure.mjs'

function sortedBy(array, key) { return [...array].sort((a, b) => String(a[key]).localeCompare(String(b[key]), 'en')) }

export function canonicalizeGlyphObject(input) {
  const glyph = structuredClone(input)
  if (glyph?.geometry) {
    glyph.geometry.paths = sortedBy(glyph.geometry.paths ?? [], 'path_id')
    glyph.geometry.components = sortedBy(glyph.geometry.components ?? [], 'component_id')
    glyph.geometry.exact_carries = sortedBy(glyph.geometry.exact_carries ?? [], 'carry_id')
  }
  if (glyph?.topology) {
    glyph.topology.components = sortedBy(glyph.topology.components ?? [], 'component_id')
    glyph.topology.holes = sortedBy(glyph.topology.holes ?? [], 'hole_id')
  }
  if (glyph?.parts) glyph.parts.nodes = sortedBy(glyph.parts.nodes ?? [], 'part_id')
  return glyph
}

export function validateGlyphObject(glyph) {
  const errors = []
  if (glyph?.profile !== 'glyph/1.0-candidate.1') errors.push({ code: 'E_PROFILE', message: 'glyph/1.0-candidate.1 profile required' })
  if (glyph?.design_space?.dimension !== '2d' || glyph?.design_space?.units !== 'design-unit') errors.push({ code: 'E_DESIGN_SPACE', message: '2d design-unit design space required' })
  for (const value of glyph?.design_space?.view_box ?? []) if (!validGlyphScalar(value)) errors.push({ code: 'E_SCALAR', message: `invalid canonical scalar ${value}` })

  const paths = glyph?.geometry?.paths ?? []
  const pathIds = paths.map((p) => p.path_id)
  if (pathIds.length !== new Set(pathIds).size) errors.push({ code: 'E_PATH_ID', message: 'path IDs must be unique' })
  if (pathIds.join('\0') !== [...pathIds].sort().join('\0')) errors.push({ code: 'E_PATH_ORDER', message: 'paths must be sorted' })
  for (const path of paths) for (const message of validateGlyphPath(path).errors) errors.push({ code: 'E_PATH', message })

  const componentResult = validateComponentGraph(glyph)
  for (const message of componentResult.errors) errors.push({ code: 'E_COMPONENT', message })

  const carries = glyph?.geometry?.exact_carries ?? []
  const carryIds = carries.map((c) => c.carry_id)
  if (carryIds.length !== new Set(carryIds).size) errors.push({ code: 'E_CARRY_ID', message: 'carry IDs must be unique' })
  if (carryIds.join('\0') !== [...carryIds].sort().join('\0')) errors.push({ code: 'E_CARRY_ORDER', message: 'exact carries must be sorted' })
  for (const carry of carries) for (const message of validateExactCarry(carry).errors) errors.push({ code: 'E_CARRY', message })

  for (const message of validateTopology(glyph).errors) errors.push({ code: 'E_TOPOLOGY', message })
  for (const message of validatePartGraph(glyph).errors) errors.push({ code: 'E_PART', message })

  for (const port of glyph?.parts?.ports ?? []) for (const value of port.anchor ?? []) if (!validGlyphScalar(value)) errors.push({ code: 'E_PORT_SCALAR', message: `port ${port.port_id} invalid anchor scalar` })
  const familyBinding = glyph?.family_binding
  if (familyBinding) for (const value of Object.values(familyBinding.parameters ?? {})) if (typeof value === 'string' && /^-?[0-9]/.test(value) && !validGlyphScalar(value)) errors.push({ code: 'E_FAMILY_SCALAR', message: `invalid family numeric parameter ${value}` })

  return { ok: errors.length === 0, errors }
}
