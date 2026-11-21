// mrepo-base-swarm: its documented methods, a directory each (README.md beside each).
//   external/   the swarm protocol's actions: create, deploy, leave, status
//   internal/   swarm.js: a position read as a swarm's or a node's, the
//               commands an action sends through its own mrepo (a helper)
export { create } from './external/create/index.js'
export { deploy } from './external/deploy/index.js'
export { leave } from './external/leave/index.js'
export { status } from './external/status/index.js'
export { NODE_PACKAGE, MASTER } from './internal/swarm.js'
