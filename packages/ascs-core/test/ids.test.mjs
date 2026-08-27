import test from 'node:test'
import assert from 'node:assert/strict'

import { newUuid7Urn } from '../src/index.mjs'

test('UUIDv7 URN preserves 48-bit timestamp and sets version/variant bits', () => {
  const urn = newUuid7Urn({
    now: 0x0190a0011111,
    random: [0xab, 0xcd, 0xef, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd],
  })
  assert.equal(urn, 'urn:uuid:0190a001-1111-7bcd-af01-23456789abcd')
  assert.match(urn, /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
})

test('UUIDv7 rejects invalid timestamp/random source shape', () => {
  assert.throws(() => newUuid7Urn({ now: -1, random: new Uint8Array(10) }), /timestamp/i)
  assert.throws(() => newUuid7Urn({ now: 1, random: new Uint8Array(9) }), /10 bytes/i)
})
