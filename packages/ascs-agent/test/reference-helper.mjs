import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const raw = zlib.gunzipSync(fs.readFileSync(path.resolve(HERE, '../reference/v07/REFERENCE_BUNDLE.json.gz')))
const BUNDLE = JSON.parse(raw.toString('utf8'))

export function referenceBytes(rel) {
  const encoded = BUNDLE.files[rel]
  if (typeof encoded !== 'string') throw new Error(`missing frozen reference ${rel}`)
  return Buffer.from(encoded, 'base64')
}

export function referenceJson(rel) {
  return JSON.parse(referenceBytes(rel).toString('utf8'))
}
