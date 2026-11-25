import test from 'brittle'
import { create, deploy, leave, status, NODE_PACKAGE } from '../index.js'

// An execution as an action sees it: main's files by path, what it wrote,
// the job it waits for, the command it ran here.
function execution (files = {}, resumed = null) {
  const e = {
    runtime: { dir: '/work/mrepos/local/host', uri: 'local/host' },
    resumed,
    entries: [],
    written: {},
    job: null,
    ran: null,
    find: async p => (p in files ? Buffer.from(typeof files[p] === 'string' ? files[p] : JSON.stringify(files[p])) : null),
    put (p, bytes) { e.written[p] = JSON.parse(bytes.toString()) },
    wait (job) { e.job = job; return null },
    run: async command => { e.ran = command; return { ran: command } },
    log (level, event, data = {}) { e.entries.push({ level, event, ...data }) }
  }
  return e
}
// The commands a job sends, each answered as the mrepo would.
const sent = answers => { const list = []; return { list, run: async parts => { list.push(parts.join(' ')); const a = answers[parts.find(p => /^[a-z]+\/[a-z]+$/.test(p) && !p.startsWith('swarms'))] ?? null; if (a instanceof Error) throw a; return a } } }
const LOOKUP = { uri: 'swarm-1/master', machine: 'm', folder: '/work/mrepos/swarm-1/master', key: 'aa'.repeat(32), registry: 'bb'.repeat(32) }
const SWARM = { 'main/swarms/swarm-1/.node.json': { kind: 'swarm', master: 'master', lease: 15000, lookup: LOOKUP } }

test('create: the swarm\'s node, its master deployed, in service and made the master, each a command; then its document, with where the lookup db is', async (t) => {
  const exec = execution()
  const s = sent({ 'boot/deploy': { mrepo: 'swarm-1/master' }, 'rns/master': { lease: 3000, lookup: LOOKUP } })
  t.is(await create(exec, { uri: ['main', 'swarms/swarm-1'], args: ['3'] }, { run: s.run }), null, 'it waits')
  t.alike(await exec.job(), { lease: 3000, lookup: LOOKUP }, 'what its job answers: the lease and the lookup')
  t.alike(s.list, [
    'crud/create swarms/swarm-1 {"kind":"swarm"}',
    `boot/deploy swarms/swarm-1/master ${NODE_PACKAGE}`,
    'haicc swarms/swarm-1/master service/initialise',
    'haicc swarms/swarm-1/master service/start',
    'haicc swarms/swarm-1/master rns/master . swarm-1 3'
  ], 'its commands, in order')
  t.alike(exec.written, {}, 'nothing written before it waits')
  const again = execution({ 'main/swarms/swarm-1/.node.json': { kind: 'swarm' } }, { output: { lease: 3000, lookup: LOOKUP } })
  t.alike(await create(again, { uri: ['main', 'swarms/swarm-1'], args: ['3'] }), { created: 'swarms/swarm-1', swarm: 'swarm-1', master: 'swarm-1/master', lease: 3000 }, 'resumed: answered')
  t.alike(again.written, { 'main/swarms/swarm-1/.node.json': { kind: 'swarm', master: 'master', lease: 3000, lookup: LOOKUP } }, 'the swarm\'s document: its kind, its master, its lookup')
  await t.exception(create(execution({}, { error: 'boot/deploy: no package' }), { uri: ['main', 'swarms/swarm-1'] }), /the swarm not made: boot\/deploy: no package/)
  // half made (its master deployed and in service, a step after it failed): gone on with
  const half = execution({ 'main/swarms/swarm-1/.node.json': { kind: 'swarm' }, 'main/swarms/swarm-1/master/.shortcuts.json': [{ mrepo: 'swarm-1/master', link: 'k' }] })
  const h = sent({ 'service/initialise': new Error('haicc swarms/swarm-1/master service/initialise: not now: service initialise (the service is started)'), 'service/start': new Error('x: not now: service start (the service is started)'), 'rns/master': { lease: 15000, lookup: LOOKUP } })
  await create(half, { uri: ['main', 'swarms/swarm-1'] }, { run: h.run })
  t.alike(await half.job(), { lease: 15000, lookup: LOOKUP }, 'a swarm half made: gone on with')
  t.absent(h.list.some(l => l.startsWith('boot/deploy')), 'its master there already: not deployed again; in service already: let be')
  await t.exception(create(execution(SWARM), { uri: ['main', 'swarms/swarm-1'] }), /a swarm already: swarms\/swarm-1/)
  await t.exception(create(execution({ 'main/notes/.node.json': { x: 1 } }), { uri: ['main', 'notes'] }), /notes exists, and is no swarm/)
  await t.exception(create(execution(), { uri: ['main', '.'] }), /missing argument: target/)
  await t.exception(create(execution(), { uri: ['main', 'swarms/9lives'] }), /not a position for a swarm or a node/)
  await t.exception(create(execution(), { uri: ['main', 'swarms/swarm-1'], args: ['soon'] }), /not a lease: soon/)
})

test('deploy: a node deployed into the swarm, in service, told where the lookup db is, registered at the master by this mrepo', async (t) => {
  const exec = execution(SWARM)
  const s = sent({ 'boot/deploy': { mrepo: 'swarm-1/node-2', package: NODE_PACKAGE }, 'rns/join': { joined: 'swarm-1', uri: 'swarm-1/node-2', key: 'cc'.repeat(32), machine: 'm', folder: '/n2' } })
  t.is(await deploy(exec, { uri: ['main', 'swarms/swarm-1/node-2'] }, { run: s.run }), null, 'it waits')
  t.alike(await exec.job(), { mrepo: 'swarm-1/node-2', package: NODE_PACKAGE, registered: 'swarm-1/master' })
  t.alike(s.list, [
    `boot/deploy swarms/swarm-1/node-2 ${NODE_PACKAGE}`,
    'haicc swarms/swarm-1/node-2 service/initialise',
    'haicc swarms/swarm-1/node-2 service/start',
    `haicc swarms/swarm-1/node-2 rns/join . swarm-1 ${JSON.stringify(LOOKUP)}`,
    `haicc swarms/swarm-1/master rns/register . ${JSON.stringify({ uri: 'swarm-1/node-2', key: 'cc'.repeat(32), machine: 'm', folder: '/n2', by: 'local/host' })}`
  ], 'its commands, in order: the creator registers, by its own unique URI')
  t.alike(await deploy(execution(SWARM, { output: { mrepo: 'swarm-1/node-2', package: NODE_PACKAGE, registered: 'swarm-1/master' } }), { uri: ['main', 'swarms/swarm-1/node-2'] }), { deployed: 'swarms/swarm-1/node-2', mrepo: 'swarm-1/node-2', package: NODE_PACKAGE, registered: 'swarm-1/master' }, 'resumed: answered')
  await t.exception(deploy(execution(), { uri: ['main', 'swarms/swarm-1/node-2'] }), /not a swarm made here: swarms\/swarm-1 \(swarm\/create swarms\/swarm-1\)/)
  await t.exception(deploy(execution(), { uri: ['main', 'node-2'] }), /not a swarm made here/)
  await t.exception(deploy(execution(SWARM), { uri: ['main', 'swarms/swarm-1/master'] }), /is the swarm's master: there already/)
  await t.exception(deploy(execution(SWARM, { error: 'rns/join: x' }), { uri: ['main', 'swarms/swarm-1/node-2'] }), /the node not deployed: rns\/join: x/)
})

test('leave: taken out of the lookup db at the master, then torn down; status: asked of the master', async (t) => {
  const files = { ...SWARM, 'main/swarms/swarm-1/node-2/.shortcuts.json': [{ mrepo: 'swarm-1/node-2', link: 'k' }] }
  const exec = execution(files)
  const s = sent({})
  await leave(exec, { uri: ['main', 'swarms/swarm-1/node-2'] }, { run: s.run })
  t.alike(await exec.job(), { mrepo: 'swarm-1/node-2' })
  t.alike(s.list, ['haicc swarms/swarm-1/master rns/leave . swarm-1/node-2', 'boot/teardown swarms/swarm-1/node-2'])
  t.alike(await leave(execution(files, { output: { mrepo: 'swarm-1/node-2' } }), { uri: ['main', 'swarms/swarm-1/node-2'] }), { left: 'swarms/swarm-1/node-2', mrepo: 'swarm-1/node-2' })
  await t.exception(leave(execution(files), { uri: ['main', 'swarms/swarm-1/master'] }), /it does not leave/)
  await t.exception(leave(execution(files), { uri: ['main', 'swarms/swarm-1/node-9'] }), /no node there: swarms\/swarm-1\/node-9/)
  const st = execution(files)
  t.alike(await status(st, { uri: ['main', 'swarms/swarm-1'] }), { ran: ['haicc', 'swarms/swarm-1/master', 'rns/status'] }, 'status: the master\'s rns/status, sent on to it')
  await t.exception(status(execution(), { uri: ['main', 'swarms/swarm-1'] }), /not a swarm made here/)
})
