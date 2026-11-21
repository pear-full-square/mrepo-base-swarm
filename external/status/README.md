# status

Answers a swarm as its master's lookup db has it: the nodes registered and whether each is active.

## Signature

`status(exec, { uri })`: requested as `swarm/status <position>`, the
swarm's.

## Returns

What the master's `rns/status` answers: the command is sent on to it.

## Errors

- The position is no swarm made here: `not a swarm made here`.
