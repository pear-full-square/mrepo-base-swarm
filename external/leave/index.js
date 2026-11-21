// leave: swarm/leave <position>, a node taken out of its swarm's lookup db
// and torn down (README.md beside it).
import { shortcutsAt } from 'mrepo-base-xpath'
import { position, swarmAt, commands } from '../../internal/swarm.js'

// (run: a test's, in place of the commands sent through the inbox)
export async function leave (exec, { uri }, { run = null } = {}) {
  const { at, name, above } = position(uri)
  if (exec.resumed) {
    if (exec.resumed.error) throw new Error(`the node not taken out: ${exec.resumed.error}`)
    exec.log('info', 'left', { at, ...exec.resumed.output })
    return { left: at, ...exec.resumed.output }
  }
  const swarm = await swarmAt(exec, above)
  if (name === swarm.master) throw new Error(`${at} is the swarm's master: it does not leave`)
  const link = (await shortcutsAt(exec, at))[0]
  if (!link) throw new Error(`no node there: ${at}`)
  const send = commands(exec, run)
  exec.log('verbose', 'leaving', { at, mrepo: link.mrepo })
  return exec.wait(async () => {
    await send(['haicc', `${above}/${swarm.master}`, 'rns/leave', '.', link.mrepo])
    await send(['boot/teardown', at])
    return { mrepo: link.mrepo }
  })
}
