# create

Makes a swarm at a position: its node, its master deployed below it and its lookup db.

## Signature

`create(exec, { uri, args })`: requested as `swarm/create <position>
[<lease>]`. `uri` is the swarm's position below `main`,
`swarms/swarm-1`; its last name is the swarm's.

## Arguments

1. The lease, in seconds: how long a node stays active without renewing.
   15 when none.

## Returns

`{ created, swarm, master, lease }`: the position, the swarm's name, its
master's unique URI, the lease in milliseconds.

What it does, each a command of the mrepo's own:

1. `crud/create <position> {"kind":"swarm"}`.
2. `boot/deploy <position>/master haiccing/base-component-node`.
3. The master brought into service: `service/initialise`, `service/start`.
4. `rns/master . <swarm> [<lease>]` at the master: the lookup db.

Then the swarm's document, `main/<position>/.node.json`: `{ kind,
master, lease, lookup }`.

## Errors

- No position: `missing argument: target`; a name that is none: `not a
  position for a swarm or a node`. A lease that is none: `not a lease`.
- A swarm there already; a node there that is no swarm.
- A step that failed: `the swarm not made:` and the command's error. What
  was made stays; asked again, it goes on from there.
