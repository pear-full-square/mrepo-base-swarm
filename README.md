# mrepo-base-swarm

The mrepo swarm protocol: a host's node management, a swarm made with its master, nodes deployed into it and registered.

Run by the mrepo a machine is managed with. It makes a swarm, a node
whose kind is `swarm`, with its master and its lookup db; deploys nodes
below it; and registers each in the lookup db: the creator registers.
Each step is a command of the mrepo's own (`crud`, `boot`, `service`,
then the node's `rns`), sent through its inbox while the request waits.
Offered by `haiccing/base-package-swarm`.

## Links

- [external](external/)
- [test](test/)

## Commands

```
haicc host swarm/create swarms/swarm-1
haicc host swarm/deploy swarms/swarm-1/node-1
haicc host swarm/status swarms/swarm-1
haicc host swarm/leave swarms/swarm-1/node-1
```

## Design

- **The host is the authority** over the swarm it creates: it deploys
  the nodes, tells each where the lookup db is, and asks the master to
  register it, by its own unique URI.
- **The swarm's node**, in the host's `main`: `{ kind, master, lease,
  lookup }`: its master's name below it and where the lookup db is,
  written when the swarm is made.
- **A node is the cell**: deployed from `haiccing/base-component-node`,
  the haicc mrepo with its swarm's services on it.
- **Half made, gone on with**: asked again after a step failed, what is
  there is not made again.
- **One master**, the swarm's first node, named `master`.

## Tests

- `brittle-bare test/*.test.js` (Bare installed): each test by its name in [test/](test/).
