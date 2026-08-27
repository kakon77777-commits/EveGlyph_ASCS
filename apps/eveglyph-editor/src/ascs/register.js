import { createCanonicalWorkspaceBridge } from './runtime-bridge.js'

const existing = globalThis.EveGlyphASCS && typeof globalThis.EveGlyphASCS === 'object'
  ? globalThis.EveGlyphASCS
  : {}

globalThis.EveGlyphASCS = Object.freeze({
  ...existing,
  createCanonicalWorkspaceBridge,
})
