// What the actions share (not documented: a helper): a request's URI read
// as a position in main, a swarm's document, the commands an action sends
// through its own mrepo's inbox while its request waits.
import { segmented, joined, within, ROOT } from 'mycelium-uri'
import { send } from 'mrepo-base-request'
import { shortcutsAt } from 'mrepo-base-xpath'

// The package a swarm's node is deployed from: the cell.
export const NODE_PACKAGE = 'haiccing/base-component-node'
// The master's name in its swarm: its first node.
export const MASTER = 'master'
export const NODE = '.node.json'
const NAME = /^[a-z][a-z0-9-]*$/

// The position a request names, as written at main: swarms/swarm-1,
// swarms/swarm-1/node-2. -> { at, name, above } (above: the position
// above it, null at the top of main)
// log: none (the URI read; its callers say what they do with it)
export function position (uri) {
  if (uri === undefined || segmented(uri).at(-1) === ROOT) throw new Error('missing argument: target')
  const at = within('main', joined(segmented(uri)))
  if (at === null || at === '') throw new Error('missing argument: target')
  const names = at.split('/')
  if (!names.every(n => NAME.test(n))) throw new Error(`not a position for a swarm or a node: ${at} (names of lowercase letters, digits, hyphens)`)
  return { at, name: names.at(-1), above: names.length > 1 ? names.slice(0, -1).join('/') : null }
}

// The document of the node at a position; null: no node there.
// log: none (one read; its callers say what they found)
export async function documentAt (exec, at) {
  const bytes = await exec.find(`main/${at}/${NODE}`)
  if (bytes === null) return null
  // catch: a document that is no JSON says nothing
  try { return JSON.parse(bytes.toString()) } catch { return {} }
}

// A swarm made here: its document says so, and where its lookup db is.
// log: none (as documentAt)
export async function swarmAt (exec, at) {
  const doc = at === null ? null : await documentAt(exec, at)
  if (doc?.kind !== 'swarm' || !doc.lookup) throw new Error(`not a swarm made here: ${at ?? '.'} (swarm/create ${at ?? '<position>'})`)
  return doc
}

// A command sent through this mrepo's own inbox, its output back; one that
// fails: thrown, with the command. (run: a test's, in its place)
// log: none (each command is a request of its own, recorded as one)
export const commands = (exec, run = null) => run ?? (async parts => {
  const r = exec.runtime
  const form = await send({ dir: r.dir, uri: r.uri, submit: r.submit, answer: r.answer }, parts)
  if ('error' in form) throw new Error(`${parts.join(' ')}: ${form.error}`)
  return form.output ?? null
})

// The mrepo deployed at a position: its unique URI; null: none there.
// log: none (one read; its callers say what they found)
export const deployedAt = async (exec, at) => (await shortcutsAt(exec, at))[0]?.mrepo ?? null

// An mrepo brought into service, wherever it stands: a transition it has
// made already is not made again (a swarm or a node half made, gone on with).
// log: none (each command is a request of its own, recorded as one)
export async function intoService (send, at) {
  for (const step of ['service/initialise', 'service/start']) {
    // catch: not now: the transition made already; anything else thrown on
    try { await send(['haicc', at, step]) } catch (err) { if (!/not now: service /.test(err.message)) throw err }
  }
}
