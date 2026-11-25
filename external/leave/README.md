# leave

Takes a node out of its swarm's lookup db and tears it down.

## Signature

`leave(exec, { uri })`: requested as `swarm/leave <position>`, the
node's.

## Returns

`{ left, mrepo }`: the position and the node's unique URI.

What it does: `rns/leave . <unique URI>` at the master, then
`boot/teardown <position>`.

## Errors

- No node deployed there: `no node there`.
- The master: `it does not leave`.
- A step that failed: `the node not taken out:` and the command's error.
