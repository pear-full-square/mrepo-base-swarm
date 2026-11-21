// status: swarm/status <position>, a swarm as its master's lookup db has
// it: asked of the master (README.md beside it).
import { position, swarmAt } from '../../internal/swarm.js'

export async function status (exec, { uri }) {
  const { at } = position(uri)
  const swarm = await swarmAt(exec, at)
  exec.log('verbose', 'asked of the master', { at, master: swarm.lookup.uri })
  return exec.run(['haicc', `${at}/${swarm.master}`, 'rns/status'])
}
