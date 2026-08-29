import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(HERE, '../src')
const FORBIDDEN = [
  'ascs-runtime',
  'WorkspaceRuntime',
  'commitExtensionMutation',
  'createWorkspaceRuntime',
  'Credential',
  'DelegationTicket',
  'McpServer',
]

function sourceFiles(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...sourceFiles(p))
    else if (entry.isFile() && entry.name.endsWith('.mjs')) out.push(p)
  }
  return out
}

function executableSource(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map(line => line.replace(/\/\/.*$/, ''))
    .join('\n')
}

test('ascs-agent source has no canonical runtime, credential, delegation, or MCP authority surface', () => {
  for (const file of sourceFiles(SRC)) {
    const source = executableSource(fs.readFileSync(file, 'utf8'))
    for (const token of FORBIDDEN) {
      assert.equal(source.includes(token), false, `${path.relative(SRC, file)} contains forbidden authority token ${token}`)
    }
  }
})
