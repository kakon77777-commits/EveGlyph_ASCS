export function newUuid7Urn({ now = Date.now(), random = null } = {}) {
  if (!Number.isSafeInteger(now) || now < 0 || now > 0xffffffffffff) throw new RangeError('UUIDv7 timestamp must fit 48 bits')
  const bytes = new Uint8Array(16)
  let timestamp = BigInt(now)
  for (let i = 5; i >= 0; i -= 1) {
    bytes[i] = Number(timestamp & 0xffn)
    timestamp >>= 8n
  }

  const randomBytes = random ? Uint8Array.from(random) : globalThis.crypto.getRandomValues(new Uint8Array(10))
  if (randomBytes.length !== 10) throw new RangeError('UUIDv7 random source must provide 10 bytes')
  bytes.set(randomBytes, 6)
  bytes[6] = (bytes[6] & 0x0f) | 0x70
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  return `urn:uuid:${uuid}`
}
