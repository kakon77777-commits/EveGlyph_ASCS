import {
  createCanonicalWorkspaceBridge,
  createHistoryRepository,
  createPersistentWorkspace,
  createSpatialModel,
  createNativeMathService,
} from './runtime-bridge.js'

const existing = globalThis.EveGlyphASCS && typeof globalThis.EveGlyphASCS === 'object'
  ? globalThis.EveGlyphASCS
  : {}

globalThis.EveGlyphASCS = Object.freeze({
  ...existing,
  createCanonicalWorkspaceBridge,
  createPersistentWorkspace,
  createHistoryRepository,
  createSpatialModel,
  createNativeMathService,
})
