# test/

The tests of mrepo-base-swarm, a section per file, each test by its name.

## `swarm.test.js`

- create: the swarm's node, its master deployed, in service and made the master, each a command; then its document, with where the lookup db is
- deploy: a node deployed into the swarm, in service, told where the lookup db is, registered at the master by this mrepo
- leave: taken out of the lookup db at the master, then torn down; status: asked of the master
