import { compareGlyphScalars, validGlyphScalar } from './scalar.mjs'

export function validateGlyphFamily(family) {
  const errors = []
  if (family?.profile !== 'glyph-family/1.0-candidate.1') errors.push('family candidate profile required')
  if (!['invariant', 'variant-allowed'].includes(family?.topology_policy)) errors.push('invalid topology policy')
  const axes = Array.isArray(family?.axes) ? family.axes : []
  const ids = axes.map((a) => a.axis_id)
  if (ids.length !== new Set(ids).size) errors.push('axis IDs must be unique')
  if (ids.join('\0') !== [...ids].sort().join('\0')) errors.push('axes must be sorted lexically by axis_id')
  for (const axis of axes) {
    if (axis.kind === 'continuous') {
      if (![axis.min, axis.max].every(validGlyphScalar) || typeof axis.default !== 'string' || !validGlyphScalar(axis.default)) {
        errors.push(`continuous axis ${axis.axis_id} requires canonical scalar min/default/max`)
      } else if (compareGlyphScalars(axis.min, axis.default) > 0 || compareGlyphScalars(axis.default, axis.max) > 0) {
        errors.push(`continuous axis ${axis.axis_id} default outside range`)
      }
    } else if (axis.kind === 'discrete' || axis.kind === 'categorical') {
      if (!Array.isArray(axis.values) || !axis.values.includes(axis.default)) errors.push(`axis ${axis.axis_id} default must be listed in values`)
    } else errors.push(`axis ${axis.axis_id} has invalid kind`)
  }
  return { ok: errors.length === 0, errors }
}
