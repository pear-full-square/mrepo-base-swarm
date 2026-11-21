// create: swarm/create <position> [lease], a swarm made at a position:
// its node, its master and its lookup db (README.md beside it).
import { position, documentAt, deployedAt, intoService, commands, NODE, NODE_PACKAGE, MASTER } from '../../internal/swarm.js'

// (run: a test's, in place of the commands sent through the inbox)
export async function create (exec, { uri, args: [lease] = [] }, { run = null } = {}) {
  const { at, name } = position(uri)
  if (lease !== undefined && !(Number(lease) > 0)) throw new Error(`not a lease: ${lease} (seconds)`)
  // The second half, resumed: the swarm's document written, with where
  // its lookup db is: what each node deployed into it is given.
  if (exec.resumed) {
    if (exec.resumed.error) throw new Error(`the swarm not made: ${exec.resumed.error}`)
    const made = exec.resumed.output
    exec.put(`main/${at}/${NODE}`, Buffer.from(JSON.stringify({ kind: 'swarm', master: MASTER, lease: made.lease, lookup: made.lookup }, null, 2) + '\n'))
    exec.log('info', 'created', { at, swarm: name, master: made.lookup.uri })
    return { created: at, swarm: name, master: made.lookup.uri, lease: made.lease }
  }
  const was = await documentAt(exec, at)
  if (was?.kind === 'swarm' && was.lookup) throw new Error(`a swarm already: ${at}`)
  if (was && was.kind !== 'swarm' && Object.keys(was).length) throw new Error(`${at} exists, and is no swarm`)
  // Each step a command of this mrepo's own, one after the other: the
  // swarm's node, its master deployed below it and brought into service,
  // made the master: its lookup db. A swarm half made (a step failed) is
  // gone on with: what is there is not made again.
  const send = commands(exec, run)
  const master = `${at}/${MASTER}`
  const there = await deployedAt(exec, master)
  exec.log('verbose', 'creating', { at, swarm: name, master, there })
  return exec.wait(async () => {
    await send(['crud/create', at, JSON.stringify({ kind: 'swarm' })])
    if (!there) await send(['boot/deploy', master, NODE_PACKAGE])
    await intoService(send, master)
    const m = await send(['haicc', master, 'rns/master', '.', name, ...(lease === undefined ? [] : [String(lease)])])
    return { lease: m.lease, lookup: m.lookup }
  })
}
