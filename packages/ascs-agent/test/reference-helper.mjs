import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REF = path.resolve(HERE, '../reference/v07')
const raw = zlib.gunzipSync(fs.readFileSync(path.join(REF, 'REFERENCE_BUNDLE.json.gz')))
const BUNDLE = JSON.parse(raw.toString('utf8'))

export function referenceBytes(rel) {
  const encoded = BUNDLE.files[rel]
  if (typeof encoded === 'string') return Buffer.from(encoded, 'base64')
  const physical = path.resolve(REF, rel)
  if (physical.startsWith(REF + path.sep) && fs.existsSync(physical) && fs.statSync(physical).isFile()) {
    return fs.readFileSync(physical)
  }
  throw new Error(`missing frozen reference ${rel}`)
}

export function referenceJson(rel) {
  return JSON.parse(referenceBytes(rel).toString('utf8'))
}
