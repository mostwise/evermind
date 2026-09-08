# Contributing to Evermind

Thanks for wanting to help. Bug reports, fixes and features are all welcome.

Before a pull request can be merged there is one thing to read properly rather
than skim, and it is in the next section. It is short, and it asks for more than
most projects do — so it also explains why.

## The sign-off, and what it means here

Every commit must carry a `Signed-off-by` line:

```bash
git commit -s -m "fix: stop the week strip announcing colour as meaning"
```

That line means two things.

**One: the Developer Certificate of Origin.** The standard [DCO 1.1][dco] — you
wrote this, or you have the right to submit it, and you are contributing it
under the project's licence. Nothing unusual.

**Two: a copyright licence grant, which is not standard, and you should know
what you are agreeing to.** You keep the copyright in what you write. You grant
the project's maintainer a perpetual, worldwide, irrevocable licence to use your
contribution — including relicensing it and **including in a proprietary,
commercial edition of Evermind that is not published under the GPL**.

### Why

Evermind is open core. This repository is GPL-3.0-or-later and is a complete,
working planner. A small number of optional features — a calendar feed, Canvas
syncing, attachments, finer reminder controls — are sold as a paid edition whose
source is not published. `docs/open-core.md` describes exactly where that line
sits and how it is enforced.

The GPL is a licence *out*, not a licence *in*. If your contribution arrives
under the GPL alone, it cannot lawfully be moved into the closed edition without
asking you first — and "asking you first" does not scale to a codebase with
contributors who have moved on, changed addresses, or simply stopped replying.
Projects that skip this step usually find out years later, when the code has
been entangled beyond separating.

So the grant is asked for up front, in plain words, rather than assumed. You are
giving the maintainer the right to earn money from code you wrote and were not
paid for. That is a real thing to give, which is why it is spelled out here
instead of buried.

### If you would rather not

Say so in the pull request. Some changes genuinely do not need it — a
documentation fix, a typo, a test, anything that will never be near the
commercial module. Those can be merged under the GPL alone, and it is better to
have the contribution than the paperwork.

A [CLA Assistant][cla] check runs on pull requests and will ask you to confirm
this once. It is recorded against your GitHub account and you will not be asked
again.

[dco]: https://developercertificate.org/
[cla]: https://github.com/contributor-assistant/github-action

## Getting set up

```bash
bun install
cp .example.env .env    # then fill in your Supabase project's values
bun run dev
```

The toolchain is [Bun][bun] throughout — there is no npm, npx or node script in
this project. Use `bun`, `bunx` and `bun test`.

[bun]: https://bun.com

## Before you open a pull request

All four must pass:

```bash
bun test
bun run typecheck
bunx biome check
bun run build
```

CI runs the same four. `bun run build` is not optional: several classes of
mistake — a client component importing server-only code, a route handler with
the wrong signature — typecheck cleanly and fail only at build.

## House style

Read a neighbouring file before writing a new one; the conventions are visible
and consistent. The two that surprise people:

- **Comments explain why, not what.** The code says what it does. A comment
  earns its place by recording the thing that is *not* visible — the bug that
  made this necessary, the alternative that was tried, the constraint that makes
  the obvious approach wrong. `lib/security/rate-limit.ts` is a good example.
- **Tests assert behaviour, not implementation.** And they say in a comment what
  would break if the assertion failed. A test whose failure message means
  nothing to the next person is half a test.

Commits are `type: lowercase subject`, in the imperative, describing the change
rather than the file. Small and frequent beats one large one.

## Licence headers

New files should carry an SPDX identifier:

```ts
// SPDX-License-Identifier: GPL-3.0-or-later
```

Existing files have not been backfilled, so absence is not a signal — the
repository as a whole is GPL-3.0-or-later, as `LICENSE` and `package.json` say.

## Reporting a security problem

Please do not open a public issue. Email `data@evermind.today` with what you
found and how to reproduce it, and you will get a reply.
