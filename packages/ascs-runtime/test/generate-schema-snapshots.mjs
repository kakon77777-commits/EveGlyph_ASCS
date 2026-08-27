import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createWorkspaceRuntime } from '../src/index.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const fixture = JSON.parse(fs.readFileSync(path.resolve(HERE, '../../ascs-core/test/fixtures/minimal_workspace.egir.json'), 'utf8'))
const out = path.resolve(process.argv[2] || 'tmp/milestone-b-runtime-snapshots')
const MATH_ID = 'urn:uuid:0190a001-1111-7abc-8def-111111111111'
const HUMAN = { actor: { type: 'human', id: 'local-user' }, mode: 'explicit' }

function options(prefix) {
  let n = 0
  return {
    clock: () => `2026-08-27T12:${prefix}:${String(++n).padStart(2, '0')}.000Z`,
    idFactory: () => `urn:uuid:0199ee${prefix}-0000-7abc-8def-${(++n).toString(16).padStart(12, '0')}`,
  }
}

async function main() {
  fs.mkdirSync(out, { recursive: true })

  const move = await createWorkspaceRuntime(fixture, options('01'))
  await move.moveObject(MATH_ID, {
    x: '410.0', y: '250.0', baseWorkspaceRevision: move.workspaceRevision, authority: HUMAN,
  })
  fs.writeFileSync(path.join(out, 'move.json'), JSON.stringify(move.snapshot(), null, 2) + '\n')

  const edit = await createWorkspaceRuntime(fixture, options('02'))
  const head = edit.objectHead(MATH_ID)
  const intrinsic = edit.revision(head).intrinsic
  intrinsic.expression.nodes.find((node) => node.id === 'n2').value = '3'
  await edit.editIntrinsic(MATH_ID, {
    intrinsic, baseWorkspaceRevision: edit.workspaceRevision, authority: HUMAN,
  })
  fs.writeFileSync(path.join(out, 'edit.json'), JSON.stringify(edit.snapshot(), null, 2) + '\n')

  const clone = await createWorkspaceRuntime(fixture, options('03'))
  await clone.cloneObject(MATH_ID, {
    baseWorkspaceRevision: clone.workspaceRevision, authority: HUMAN,
  })
  fs.writeFileSync(path.join(out, 'clone.json'), JSON.stringify(clone.snapshot(), null, 2) + '\n')

  process.stdout.write(`${out}\n`)
}

await main()
