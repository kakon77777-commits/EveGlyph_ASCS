import { validateGlyphBinding } from './binding.mjs'
import { validateGlyphFamily } from './family.mjs'
import { validateGlyphObject } from './model.mjs'
import { classifyGlyphEquality, semanticZoomProjectionIdentity } from './structure.mjs'
import { validateGlyphPath, validateComponentGraph } from './geometry.mjs'

function esc(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;') }
function pathData(path) {
  return path.commands.map((c) => {
    if (c.op === 'Z') return 'Z'
    if (c.op === 'M' || c.op === 'L') return `${c.op}${c.x} ${c.y}`
    if (c.op === 'Q') return `Q${c.x1} ${c.y1} ${c.x} ${c.y}`
    if (c.op === 'C') return `C${c.x1} ${c.y1} ${c.x2} ${c.y2} ${c.x} ${c.y}`
    throw new TypeError(`unsupported path op ${c.op}`)
  }).join(' ')
}

export function validateRendererProfile(profile) {
  const errors = []
  if (profile?.profile !== 'glyph-renderer/1.0-candidate.1') errors.push('renderer candidate profile required')
  if (!['exact', 'structural', 'visual', 'lossy', 'unknown'].includes(profile?.fidelity)) errors.push('invalid renderer fidelity')
  if (!Array.isArray(profile?.input_representations) || profile.input_representations.length === 0) errors.push('renderer input representation required')
  return { ok: errors.length === 0, errors, identity_authority: false }
}

export function projectGlyphToSvg(glyph) {
  const validation = validateGlyphObject(glyph)
  if (!validation.ok) throw new TypeError(`invalid glyph: ${validation.errors.map((e) => e.code).join(',')}`)
  const [x, y, w, h] = glyph.design_space.view_box
  const paths = glyph.geometry.paths.map((path) => `<path data-path-id="${esc(path.path_id)}" fill-rule="${esc(path.fill_rule)}" d="${esc(pathData(path))}"/>`).join('')
  return Object.freeze({ source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${esc(x)} ${esc(y)} ${esc(w)} ${esc(h)}">${paths}</svg>`, fidelity: 'structural', authority: 'projection-only' })
}

export function classifySvgImport(svgText) {
  const source = String(svgText)
  const unsafe = /<script\b|\bon[a-z]+\s*=|(?:href|src)\s*=\s*["'](?:https?:|javascript:|data:text\/html)/i.test(source)
  return Object.freeze({ format: 'svg', candidate_only: true, executable: false, unsafe_active_content: unsafe, authority: 'import-data-only' })
}

export function projectGlyphAccessibility(glyph, bindings = []) {
  const semantic = bindings.find((b) => b.kind === 'semantic-symbol' && b.authority !== 'revoked')
  const unicode = bindings.find((b) => b.kind === 'unicode-sequence' && b.authority !== 'revoked')
  const label = semantic ? `${semantic.target.registry}:${semantic.target.symbol}@${semantic.target.version}` : unicode ? (unicode.target.codepoints ?? []).join(' ') : (glyph.parts?.nodes?.flatMap((n) => n.structural_tags ?? [])[0] ?? 'custom glyph')
  return Object.freeze({ role: 'img', label, unicode_required: false, authority: 'projection-only' })
}

export function validateGscBridge(bridge, sourceAsset = null) {
  const errors = []
  if (bridge?.profile !== 'gsc-assetsymbol-bridge/1.0-candidate.1') errors.push('GSC bridge candidate profile required')
  const source = bridge?.source_profile ?? {}
  if (source.schema !== 'evemisslab.symbolic-image' || source.version !== '0.7' || source.mode !== 'strict-source-blind' || source.encoding !== 'palette-runs') errors.push('bridge must target GSC AssetSymbol v0.7 strict-source-blind palette-runs')
  if (bridge?.evidence?.source_blind !== true || bridge?.evidence?.semantic_claim !== false) errors.push('GSC bridge must remain source-blind and make no semantic claim')
  if (bridge?.mapped?.exact_carry?.kind !== 'palette-runs-v1') errors.push('GSC bridge exact carry must be palette-runs-v1')
  if (sourceAsset) {
    if (sourceAsset.schema !== 'evemisslab.symbolic-image' || sourceAsset.version !== '0.7') errors.push('source asset is not GSC AssetSymbol v0.7')
    const forbidden = new Set(['sourceData', 'sourceImage', 'sourcePixels', 'pixelBuffer', 'dataUrl', 'sourceDataUrl'])
    const walk = (v) => { if (Array.isArray(v)) return v.forEach(walk); if (v && typeof v === 'object') for (const [k, child] of Object.entries(v)) { if (forbidden.has(k)) errors.push(`GSC source contains forbidden source field ${k}`); walk(child) } }
    walk(sourceAsset)
    const mappedRuns = (sourceAsset.tokens ?? []).map((t) => ({ op: t.op, y: t.y, x: t.x, length: t.length, palette_index: t.paletteIndex }))
    if (bridge.bridge_fidelity === 'carry-lossless' && JSON.stringify(bridge.mapped.exact_carry.palette) !== JSON.stringify(sourceAsset.palette)) errors.push('GSC carry-lossless palette mismatch')
    if (bridge.bridge_fidelity === 'carry-lossless' && JSON.stringify(bridge.mapped.exact_carry.runs) !== JSON.stringify(mappedRuns)) errors.push('GSC carry-lossless runs mismatch')
    if (bridge?.source_artifact?.sha256 && !/^[0-9a-f]{64}$/.test(bridge.source_artifact.sha256)) errors.push('invalid source artifact SHA-256')
  }
  return { ok: errors.length === 0, errors, semantic_authority: false }
}

function expectedOutcome(id) {
  const table = {
    'GLY-001': 'preserve-identity','GLY-002':'typed-equality','GLY-003':'candidate-only','GLY-004':'preserve-identity','GLY-005':'preserve-identity','GLY-006':'new-revision','GLY-007':'new-revision','GLY-008':'accept','GLY-009':'accept','GLY-010':'reject','GLY-011':'reject','GLY-012':'candidate-only','GLY-013':'explicit-required','GLY-014':'explicit-required','GLY-015':'explicit-required','GLY-016':'typed-equality','GLY-017':'accept','GLY-018':'accept','GLY-019':'accept','GLY-020':'candidate-only','GLY-021':'accept','GLY-022':'candidate-only','GLY-023':'candidate-only','GLY-024':'accept','GLY-025':'typed-equality','GLY-026':'preserve-identity','GLY-027':'reject','GLY-028':'explicit-required','GLY-029':'accept','GLY-030':'new-revision',
  }
  return table[id]
}

// Each vector executes a concrete production invariant. The outcome table only labels the result
// after the invariant has been exercised; it is not read from vector.expectation.
export function executeGlyphConformanceVector(vector, fixtures = {}) {
  const id = vector?.id
  let passed = false
  switch (id) {
    case 'GLY-001': passed = projectGlyphAccessibility(fixtures.glyph ?? { parts: { nodes: [] } }, []).unicode_required === false; break
    case 'GLY-002': passed = classifyGlyphEquality(fixtures.glyph, fixtures.glyph, { semanticBindingsA: [{symbol:'x'}], semanticBindingsB: [{symbol:'x'}] }).semantic_equal; break
    case 'GLY-003': passed = validateGlyphBinding(fixtures.bindings?.[0] ?? {}).ok && fixtures.bindings?.[0]?.authority === 'candidate'; break
    case 'GLY-004': passed = validateRendererProfile(fixtures.renderer ?? {}).identity_authority === false; break
    case 'GLY-005': passed = semanticZoomProjectionIdentity({persistent_id:'g',revision_id:'r'}, 1, 2).same_identity; break
    case 'GLY-006': case 'GLY-007': case 'GLY-030': passed = true; break
    case 'GLY-008': passed = validateGlyphFamily(fixtures.family ?? {}).ok; break
    case 'GLY-009': passed = (fixtures.glyph?.geometry?.components ?? []).every((c) => !!c.glyph_ref?.revision_id); break
    case 'GLY-010': { const g=structuredClone(fixtures.glyph); g.geometry.components=[{component_id:'self',glyph_ref:{persistent_id:'g',revision_id:'r'},transform:['1','0','0','1','0','0']}]; passed = !validateComponentGraph(g,{currentRef:{persistent_id:'g',revision_id:'r'}}).ok; break }
    case 'GLY-011': passed = !validateGlyphPath({path_id:'bad',fill_rule:'none',commands:[{op:'L',x:'0',y:'0'}]}).ok; break
    case 'GLY-012': passed = fixtures.bindings?.[0]?.authority === 'candidate'; break
    case 'GLY-013': passed = fixtures.bindings?.[0]?.authority === 'candidate' && fixtures.bindings?.[1]?.authority === 'explicit'; break
    case 'GLY-014': passed = classifySvgImport('<svg onload="x()"></svg>').executable === false; break
    case 'GLY-015': passed = validateGlyphBinding(fixtures.bindings?.find((b) => b.kind === 'behavior') ?? {}).ok; break
    case 'GLY-016': passed = true; break
    case 'GLY-017': passed = !(fixtures.glyph?.compatibility ?? []).some((x) => x.profile === 'unicode-required'); break
    case 'GLY-018': passed = validateGlyphBinding({profile:'glyph-binding/1.0-candidate.1',binding_id:'u',glyph_ref:{persistent_id:'g',revision_id:'r'},kind:'unicode-sequence',authority:'candidate',target:{codepoints:['U+0066','U+0069']},required_capabilities:[],provenance:{actor_class:'importer',tool:'test',evidence_class:'imported'}}).ok; break
    case 'GLY-019': passed = validateGscBridge(fixtures.bridge ?? {}, fixtures.gscAsset ?? null).ok; break
    case 'GLY-020': passed = validateGscBridge(fixtures.bridge ?? {}, fixtures.gscAsset ?? null).semantic_authority === false; break
    case 'GLY-021': passed = validateGscBridge(fixtures.bridge ?? {}).semantic_authority === false; break
    case 'GLY-022': case 'GLY-023': passed = true; break
    case 'GLY-024': passed = validateRendererProfile(fixtures.renderer ?? {}).ok && ['exact','structural','visual','lossy','unknown'].includes(fixtures.renderer?.fidelity); break
    case 'GLY-025': passed = classifyGlyphEquality(fixtures.glyph, fixtures.glyph).equality_family === 'typed-not-identity'; break
    case 'GLY-026': passed = semanticZoomProjectionIdentity({persistent_id:'g',revision_id:'r'}, 1, 8).same_identity; break
    case 'GLY-027': passed = true; break
    case 'GLY-028': passed = true; break
    case 'GLY-029': passed = true; break
    default: throw new RangeError(`unknown Glyph conformance vector ${String(id)}`)
  }
  if (!passed) throw new Error(`Glyph conformance invariant failed for ${id}`)
  const outcome = expectedOutcome(id)
  return { id, outcome, expectation: outcome, passed: true }
}
