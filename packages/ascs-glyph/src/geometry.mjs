import { validGlyphScalar } from './scalar.mjs'

const REQUIRED_COORDS = Object.freeze({
  M: ['x', 'y'],
  L: ['x', 'y'],
  Q: ['x1', 'y1', 'x', 'y'],
  C: ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
  Z: [],
})

export function validateGlyphPath(path) {
  const errors = []
  const commands = path?.commands
  if (!Array.isArray(commands) || commands.length === 0 || commands[0]?.op !== 'M') {
    return { ok: false, errors: [`path ${path?.path_id ?? '<unknown>'} must start with M`] }
  }
  let closed = false
  for (let i = 0; i < commands.length; i += 1) {
    const command = commands[i]
    const required = REQUIRED_COORDS[command?.op]
    if (!required) {
      errors.push(`path ${path.path_id} command ${i} invalid op`)
      continue
    }
    for (const key of required) {
      if (!validGlyphScalar(command[key])) errors.push(`path ${path.path_id} command ${i} invalid scalar ${key}`)
    }
    if (command.op === 'Z') {
      if (i !== commands.length - 1) errors.push(`path ${path.path_id} Z must be final command`)
      closed = true
    } else if (closed) {
      errors.push(`path ${path.path_id} has command after Z`)
    }
  }
  return { ok: errors.length === 0, errors }
}

export function validateExactCarry(carry) {
  const errors = []
  if (carry?.kind !== 'palette-runs-v1') errors.push('exact carry kind must be palette-runs-v1')
  if (carry?.fidelity !== 'exact') errors.push('exact carry fidelity must be exact')
  const width = carry?.canvas?.width
  const height = carry?.canvas?.height
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) errors.push('exact carry canvas must be positive integers')
  const palette = Array.isArray(carry?.palette) ? carry.palette : []
  const runs = Array.isArray(carry?.runs) ? carry.runs : []
  let expectedY = 0
  let expectedX = 0
  for (const run of runs) {
    if (run?.op !== 'RUN') errors.push('exact carry run op must be RUN')
    if (!Number.isInteger(run?.palette_index) || run.palette_index < 0 || run.palette_index >= palette.length) {
      errors.push(`carry ${carry?.carry_id ?? '<unknown>'} references invalid palette index`)
      continue
    }
    if (run.y !== expectedY || run.x !== expectedX || !Number.isInteger(run.length) || run.length < 1 || run.x + run.length > width) {
      errors.push(`carry ${carry?.carry_id ?? '<unknown>'} RUN stream is not exact sequential coverage`)
      break
    }
    expectedX += run.length
    if (expectedX === width) {
      expectedX = 0
      expectedY += 1
    }
  }
  if (expectedY !== height || expectedX !== 0) errors.push(`carry ${carry?.carry_id ?? '<unknown>'} RUN stream does not cover full canvas`)
  return { ok: errors.length === 0, errors }
}

function refKey(ref) {
  return `${ref?.persistent_id ?? ''}\0${ref?.revision_id ?? ''}`
}

export function validateComponentGraph(glyph, { currentRef = null, resolver = null, maxDepth = 64, maxPrimitives = 100000 } = {}) {
  const errors = []
  const components = glyph?.geometry?.components ?? []
  const ids = components.map((item) => item.component_id)
  if (ids.length !== new Set(ids).size) errors.push('component IDs must be unique')
  if (ids.join('\0') !== [...ids].sort().join('\0')) errors.push('geometry.components must be sorted lexically by component_id')
  for (const component of components) {
    if (!component?.glyph_ref?.persistent_id || !component?.glyph_ref?.revision_id) errors.push(`component ${component?.component_id ?? '<unknown>'} must pin persistent_id and revision_id`)
    if (!Array.isArray(component?.transform) || component.transform.length !== 6 || component.transform.some((v) => !validGlyphScalar(v))) {
      errors.push(`component ${component?.component_id ?? '<unknown>'} transform must contain six canonical scalars`)
    }
    if (currentRef && refKey(component.glyph_ref) === refKey(currentRef)) errors.push(`component cycle detected through ${component.component_id}`)
  }
  if (resolver && currentRef) {
    try {
      expandComponents(currentRef, resolver, { maxDepth, maxPrimitives })
    } catch (error) {
      errors.push(error.message)
    }
  }
  return { ok: errors.length === 0, errors }
}

export function expandComponents(rootRef, resolver, { maxDepth = 64, maxPrimitives = 100000 } = {}) {
  if (typeof resolver !== 'function') throw new TypeError('component resolver must be a function')
  const active = new Set()
  let primitives = 0

  function visit(ref, depth) {
    if (depth > maxDepth) throw new RangeError('component expansion exceeds maxDepth')
    const key = refKey(ref)
    if (active.has(key)) throw new Error(`component cycle detected at ${key}`)
    active.add(key)
    const glyph = resolver(ref)
    if (!glyph) throw new Error(`component revision not found: ${key}`)
    primitives += (glyph.geometry?.paths?.length ?? 0) + (glyph.geometry?.exact_carries?.length ?? 0)
    if (primitives > maxPrimitives) throw new RangeError('component expansion exceeds maxPrimitives')
    const children = (glyph.geometry?.components ?? []).map((c) => ({
      component_id: c.component_id,
      glyph_ref: structuredClone(c.glyph_ref),
      transform: structuredClone(c.transform),
      expansion: visit(c.glyph_ref, depth + 1),
    }))
    active.delete(key)
    return { glyph_ref: structuredClone(ref), children }
  }

  return visit(rootRef, 0)
}
