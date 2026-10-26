# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AJ Gebara's personal website. Stack: Astro + TypeScript, Vite, Tailwind CSS. The repo is not scaffolded yet; the first phase in `docs/PLAN.md` should create the Astro project and the npm scripts below. `docs/PLAN.md` is the source of truth for phases and milestones.

## Commands

These scripts must exist in `package.json` once scaffolded; agents rely on these names.

```
npm run dev              # astro dev server
npm run build            # astro build (output in dist/)
npm run preview          # serve the built site
npm run check            # astro check (types + .astro diagnostics)
npm run lint             # eslint
npm run test             # vitest run
npx vitest run <file>    # single unit test file
npm run e2e              # playwright test against the built site
npx playwright test <file> -g "<name>"   # single e2e test
```

## Sidekick mode

AJ writes the learning-critical code himself. Each milestone in `docs/PLAN.md` marks its pieces **AJ** or **Claude**. For AJ's pieces, Claude gives the file, function/component signature, insertion point and the concept, never the body. Claude may write tests, fixtures, scaffolding, config, docs, and any piece AJ explicitly hands over with "you write this one". Nothing is committed unless AJ asks.

## Workflow: build and review loop

Substantial work runs through six subagents in `.claude/agents/`: `planner` (Espeon), `coder` (Porygon), `reviewer` (Noctowl), `adversary` (Gengar), `gatekeeper` (Metagross), and `tester` (Ditto). The main session orchestrates; it does not write the code itself.

At the start of a phase or milestone, run `planner` once. It writes `docs/review/phase-N-plan.md` and is never part of the revision loop.

Each round N (max 3):
1. `coder` implements the Claude-owned plan items (round 1) or fixes the items in `docs/review/round-(N-1)-verdict.md`.
2. `reviewer` reviews the diff and writes `docs/review/round-N-review.md`.
3. `adversary` reviews that review and the code, and writes `docs/review/round-N-adversary.md`.
4. `gatekeeper` runs the checks and writes `docs/review/round-N-verdict.md`, whose first line is `VERDICT: SATISFIED` or `VERDICT: REVISE`.

After a `VERDICT: SATISFIED`, run `tester` once. It writes tests from the milestone in `docs/PLAN.md` (not from the implementation), edits only test code, and writes `docs/review/tester-report.md`. If it reports BLOCKING bugs, treat them as the required items of a new round while rounds remain under the cap; otherwise escalate to AJ.

Definition of satisfied: `npm run check`, `npm run lint`, `npm run build`, `npm run test` and `npm run e2e` pass, the change does what the milestone describes, and the only remaining issues are minor and non-blocking.

If the verdict is REVISE, start the next round with only the verdict's required items passed to the coder. If round 3 still ends in REVISE (`ESCALATE: yes`), stop and give AJ the open blocking items instead of looping. Pass state between agents through the files in `docs/review/`, not through chat, and don't share the coder's reasoning with the reviewers.
