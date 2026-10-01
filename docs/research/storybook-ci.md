# Running story tests in CI without testing everything on every push

Date: 2026-10-01. Status: research input. What it fed: the `STORY_VARIANTS` switch in
`apps/storybook/vitest.config.ts` and the `stories` / `stories-all` jobs in `.github/workflows/check.yml`.

## Question

Every push ran all 292 stories in four variants (locale × theme), 1168 Vitest browser tests, about 3.5
minutes in GitHub Actions, plus a Chromium install. What can a pull request skip, safely, and what has to
run somewhere? Versions checked: Vitest 4.1.11, Storybook 10.6.1, current Turborepo, Chromatic, Playwright
and GitHub Actions docs.

## Findings

**Vitest `--changed`.**
- It diffs with `git diff --name-only <ref>...HEAD`, plus staged and untracked files
  ([git.ts](https://github.com/vitest-dev/vitest/blob/v4.1.11/packages/vitest/src/node/vcs/git.ts)). The
  three-dot diff needs the merge base, so CI checks out with `fetch-depth: 0`.
- It keeps a test when a changed file is in its static import graph, walked through Vite's transforms in
  Node before any browser starts
  ([specifications.ts](https://github.com/vitest-dev/vitest/blob/v4.1.11/packages/vitest/src/node/specifications.ts)).
  So it works in browser mode. With `storybookTest`, a story file keeps its own imports, so a changed
  component selects its stories
  ([vitest-plugin](https://github.com/storybookjs/storybook/blob/v10.6.1/code/addons/vitest/src/vitest-plugin/index.ts)).
- Three traps, and what we did about each:
  1. The preview reaches every story through a setup file that imports a virtual module
     ([setup-file-with-project-annotations.ts](https://github.com/storybookjs/storybook/blob/v10.6.1/code/addons/vitest/src/vitest-plugin/setup-file-with-project-annotations.ts)).
     Nothing the preview imports is traced: its stylesheet, the tokens, the recipes' dictionaries.
  2. Vitest 4.1's default `forceRerunTriggers` match nothing because of a trailing `/**` on file globs
     ([#10421](https://github.com/vitest-dev/vitest/issues/10421); fixed in v5).
  3. `--changed` implies `passWithNoTests`, so an empty selection passes.

  So the config spells out its own triggers: `.storybook`, `packages/ui/src/styles`, the recipes'
  messages, `package.json`, the Vitest config and `bun.lock`. We checked them by hand. One recipe
  selected 100 of 584 tests and the button primitive 230. The preview, the tokens and a dictionary each
  selected all 584. A change in `apps/app` alone selected none.

**Storybook's guidance.** Its CI page runs the same `vitest` command with no change selection
([in CI](https://storybook.js.org/docs/writing-tests/in-ci)). The addon's FAQ recommends `isolate: false`
and `vitest --shard` for CI ([vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)).
With `isolate: false`, story files share one page instead of an iframe each. Locally that took the full
matrix from about 100 s to 38 s, still green, and a shuffled run passed too.

**GitHub Actions.**
- A workflow skipped by `on.*.paths` leaves required checks pending. A job skipped by `if:` reports
  success ([workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onpushpull_requestpull_request_targetpathspaths-ignore),
  [conditions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-jobs-with-conditions)).
  That is why the story jobs are gated by `dorny/paths-filter` ([README](https://github.com/dorny/paths-filter)).
- `concurrency` with `cancel-in-progress` drops superseded runs
  ([concurrency](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#concurrency)).

**Playwright.**
- Caching browsers is not recommended: restoring takes about as long as downloading, and the OS
  dependencies cannot be cached ([CI](https://playwright.dev/docs/ci#caching-browsers)).
- `--only-shell` installs the smaller headless shell
  ([browsers](https://playwright.dev/docs/browsers#chromium-headless-shell)).

**Chromatic.**
- TurboSnap needs 10 CI builds before it activates, and it does not work with the `pull_request` trigger
  ([setup](https://www.chromatic.com/docs/turbosnap/setup)).
- Files outside the bundle graph, like our `staticDirs`, go in `externals`
  ([TurboSnap](https://www.chromatic.com/docs/turbosnap)).
- Snapshots are billed as tests × builds × browsers × modes ([billing](https://www.chromatic.com/docs/billing)),
  and modes cannot be narrowed per branch ([modes](https://www.chromatic.com/docs/modes)).

**Turborepo `--affected`** works at package level by default; task-level selection needs
`futureFlags.affectedUsingTaskInputs` in 2.9 ([run](https://turborepo.com/docs/reference/run#--affected),
[configuration](https://turborepo.com/docs/reference/configuration#affectedusingtaskinputs)). The repo is
on 2.7, and `paths-filter` with `--changed` already narrows further than packages do, so it is not used.

## Not verified

- Running the browser through the runner's preinstalled Chrome (`channel: 'chrome'`) to skip the
  download.
- Folding the four projects into one with `browser.instances`, which would share one Vite server.
