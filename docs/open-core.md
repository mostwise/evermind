# Open core

Evermind is a complete planner, and this repository contains all of it. Some
optional capabilities are supplied by a separate module that is not part of this
repository; if you are reading this in a clone, you have the free edition and it
is whole.

This document explains the seam, because you will see it in the code and it is
better to know what it is than to guess.

## What you will find

```
lib/pro/contract.ts     the interfaces — what an optional capability looks like
lib/pro/index.ts        the accessor — asks the module what is available
pro-stub/index.ts       the answer when there is no module: nothing is available
app/api/pro/*           route shells with no bodies
pro/                    absent here (see below)
```

`next.config.mjs` decides which implementation the build gets, once, by looking
for `pro/index.ts` on disk:

```js
const proModulePath = existsSync(proEntry) ? "./pro/index.ts" : "./pro-stub/index.ts";
```

There is no environment variable and no runtime branch. A build without that
directory does not contain the optional code, so there is nothing to enable.

## Why absence rather than a flag

A flag saying `pro: false` is one line for anyone to change, which makes it a
lock that only works on people who agree to be locked. Building the boundary out
of module resolution instead means the honest answer to "how do I turn these
on" is "you cannot, the code is not here" — and that is a much better answer
than one that invites a patch.

It also means this repository stays GPL-3.0 and complete. Nothing here is
crippled, nothing is time-limited, and no feature in this tree checks whether
you have paid for anything. `tests/pro-boundary.test.ts` asserts that, including
that no payment processor is imported anywhere in the public tree or declared in
`package.json`.

## The three states a capability can be in

```ts
{ available: true }                     // use it
{ available: false }                    // this edition does not have it — render nothing
{ available: false, cta: { … } }        // it exists but is not yours yet — render the cta
```

The middle one is what a clone of this repository always sees. Consuming
components must render **nothing at all** for it — not a disabled control, not a
greyed-out card, not an upsell. A self-hosted install should not carry
advertising for an edition its operator cannot buy.

The third state can only be produced by a module that is not in this repository,
and the wording it carries comes from there too. That is why nothing in this
tree contains a price, a plan name or a call to action.

## Building without it

Nothing to do. `bun install && bun run build` works as-is, `bun test` passes,
and the routes under `app/api/pro/` answer 404 because there is no handler
behind them.

If you want to confirm that for yourself:

```bash
bun run build
bun run start
curl -X POST -H "sec-fetch-site: same-origin" localhost:3000/api/pro/checkout
# {"error":"Not found"}
```

## Adding a module of your own

The seam is not private API. `lib/pro/contract.ts` is the whole interface: write
something that satisfies `ProModule`, put it at `pro/index.ts`, and the build
will pick it up. That is a supported way to add capabilities to your own
instance without forking.

## Contributing

Contributions are welcome under GPL-3.0 with a sign-off — see `CONTRIBUTING.md`.
It asks for a copyright licence grant as well as a DCO, and says plainly why:
so that a contribution can also be included in the commercial edition. If you
are not comfortable with that, say so in the pull request rather than not
contributing; some changes do not need it.
