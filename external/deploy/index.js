// deploy: swarm/deploy <position>, a node deployed into a swarm and
// registered in its lookup db by this mrepo, its creator (README.md
// beside it).
import { position, swarmAt, deployedAt, intoService, commands, NODE_PACKAGE } from '../../internal/swarm.js'

// (run: a test's, in place of the commands sent through the inbox)
export async function deploy (exec, { uri }, { run = null } = {}) {
  const { at, name, above } = position(uri)
  if (exec.resumed) {
    if (exec.resumed.error) throw new Error(`the node not deployed: ${exec.resumed.error}`)
    exec.log('info', 'deployed', { at, ...exec.resumed.output })
    return { deployed: at, ...exec.resumed.output }
  }
  const swarm = await swarmAt(exec, above)
  if (name === swarm.master) throw new Error(`${at} is the swarm's master: there already`)
  const send = commands(exec, run)
  const master = `${above}/${swarm.master}`
  const there = await deployedAt(exec, at)
  exec.log('verbose', 'deploying', { at, swarm: above, there })
  // Deployed and brought into service; told where its swarm's lookup db
  // is; registered there by this mrepo: the creator registers. A node
  // half made (a step failed) is gone on with.
  return exec.wait(async () => {
    if (!there) await send(['boot/deploy', at, NODE_PACKAGE])
    await intoService(send, at)
    const j = await send(['haicc', at, 'rns/join', '.', above.split('/').at(-1), JSON.stringify(swarm.lookup)])
    await send(['haicc', master, 'rns/register', '.', JSON.stringify({ uri: j.uri, key: j.key, machine: j.machine, folder: j.folder, by: exec.runtime.uri })])
    return { mrepo: j.uri, package: NODE_PACKAGE, registered: swarm.lookup.uri }
  })
}
