# deploy

Deploys a node below a swarm made here and registers it in the swarm's lookup db.

## Signature

`deploy(exec, { uri })`: requested as `swarm/deploy <position>`. `uri`
is the node's position, one name below its swarm's:
`swarms/swarm-1/node-1`.

## Returns

`{ deployed, mrepo, package, registered }`: the position, the node's
unique URI, the package it came from, the master it was registered at.

What it does, each a command of the mrepo's own:

1. `boot/deploy <position> haiccing/base-component-node`.
2. The node brought into service.
3. `rns/join . <swarm> <lookup>` at the node: where the lookup db is.
4. `rns/register . <node>` at the master, by this mrepo's unique URI.

## Errors

- The position above is no swarm made here: `not a swarm made here`.
- The master's own position: `there already`.
- A step that failed: `the node not deployed:` and the command's error.
  Asked again, it goes on from there.
