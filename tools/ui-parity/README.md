# UI parity harness

Compares what the application paints now against what it painted before the
Tailwind migration started, so a slice can be checked against the real previous
build instead of against a list of properties someone remembered to write down.

Five regressions reached `core-next` because each slice verified a chosen
subset: user agent margins on converted paragraphs, font weight inherited from
`Tooltip` and `ListSubheader`, the `body1` size lost by the account list
subheaders, every MUI text field collapsing by its vertical padding once the
global `box-sizing` reset outranked MUI's cascade layer, and four year-review
cards rendering in Arial inside a `ButtonBase`. None were visible in a
screenshot. The last two were found by this harness on its first two runs.

## What it compares

The snapshot records two things, both keyed by where they land on the page
rather than by DOM structure, because the DOM is exactly what the migration
changes:

- **text runs** — every text node, with the rectangle the text actually
  occupies (from a `Range`, not the element box) and the computed
  `fontSize`, `lineHeight`, `fontWeight`, `fontFamily`, `fontStyle`,
  `letterSpacing`, `textTransform`, `textDecorationLine`, `color`,
  `textAlign`, and `whiteSpace` of its parent;
- **painted boxes** — every element with a background, border, or shadow, with
  its rectangle, `backgroundColor`, `borderRadius`, `boxShadow`, and border.

Text runs are aligned between snapshots by their content, so removing a
`Typography` wrapper does not desynchronise the comparison. Boxes are aligned
by rectangle.

## Baseline

`e8f2079d` is the commit before `d8fd2909 feat(ui): add Tailwind compatibility
foundation`, so it is the last state with no Tailwind in the build.

```bash
git worktree add --detach .claude/worktrees/ui-baseline e8f2079d
pnpm --dir .claude/worktrees/ui-baseline install
```

The `zerro-ui-baseline` entry in `.claude/launch.json` serves that worktree on
port 3001. The current checkout keeps port 3000. Separate ports mean separate
origins, so the two instances never share stored state.

## Procedure

Both tabs must be in the same state or the diff is meaningless. Same viewport,
same colour mode, same route, same scroll position, same data.

1. Start the sink, which both receives snapshots and serves the capture:

   ```bash
   node tools/ui-parity/sink.mjs --dir .ui-parity
   ```

2. Open `http://localhost:3001` and `http://localhost:3000`, enter demo mode in
   each, and set the same colour mode in both:
   `localStorage.setItem('mui-mode', 'light')`, then reload.
3. Set the same viewport on both tabs and reload after resizing. Recharts keeps
   its previously measured width until something makes it re-measure, so a
   snapshot taken right after a resize reports a page wider than it is.
4. Navigate both to the route under test, then **reload both**. Capturing after
   a long hot-reload session reports differences that a fresh load does not
   have: an HMR-stale navigation highlight cost half an hour once.
5. In each tab, install the capture and snapshot:

   ```js
   await fetch('http://localhost:3002/capture.js')
     .then(r => r.text())
     .then(eval)
   await __uiParityCapture('budget-base') // or -head in the other tab
   ```

   The capture is served from this repository, so both pages run the same
   source. It survives client-side navigation but not a reload; re-install
   after one. Without a name it returns the snapshot for manual read-back
   through `chunk(i)` instead of posting it.

6. Compare:

   ```bash
   node tools/ui-parity/diff.mjs .ui-parity/budget-base.json .ui-parity/budget-head.json
   ```

   `--tolerance` sets the pixel slack for geometry, default 1. The exit code is
   1 when anything differs.

## Reading the output

Differences are grouped, so one systemic change reads as one finding with a
count rather than as hundreds of lines. Every group is either a regression or a
decision worth recording in the migration journal — the harness does not know
which, and deliberate changes stay listed on purpose.

Known accepted differences at the time of writing:

- `fontFamily` gains an `Arial` fallback wherever `font-sans` was added, because
  the Tailwind token lists a fallback the MUI theme value does not. The resolved
  face is the same.
- `borderRadius` reads `50%` before and `1.67772e+07px` after wherever a circle
  became `rounded-full`. Identical on a square element.
- a divider's 1px line moved from the bottom border to the top border of a 1px
  tall element. Same painted line.
- the emoji in `TagIcon` has a 32px line box instead of 36px. It is centred in a
  fixed square, so the glyph lands in the same place; the text run rectangles
  match.
- budget rows paint an opaque `bg-card` where the original was transparent. The
  original `sx={{ background: 'background.paper' }}` never resolved, because
  MUI's system maps `bgcolor`, not the `background` shorthand. The mobile slide
  reveal needs the row to be opaque.
- heading levels changed where a panel title moved from MUI's `h6` variant
  mapping to a real `h2`. That is invisible to this harness, which records
  computed style and geometry rather than tag names.

Open, not yet explained:

- on `/review`, the pie in `NotFunCard` renders its `recharts-pie-labels` layer
  in the current build and not in the baseline, so two labels exist only in the
  current one. Both sides run the same recharts version and the chart's own code
  is unchanged apart from a `Stack` becoming a `div`. Recharts only mounts that
  layer once the pie animation reports finished, so something is keeping the
  baseline animation from completing. The current build shows what the code
  asks for; the baseline was dropping it.

## Limits

- It compares one route in one state. Hover, focus, open overlays, and empty or
  error states each need their own pass.
- It cannot see anything the demo data does not produce.
- Canvas and SVG interiors are compared only through the text inside them.
- Both sides must run on the same day: the demo fixture is generated relative to
  the current date.
- Charts settle on their own schedule. Capture twice and compare the run counts
  before trusting a chart-heavy route.
- The browser pane lays out only the tab it is displaying. A snapshot taken
  while the pane is hidden or the tab is in the background can miss a lazily
  rendered list entirely and makes `react-wrap-balancer` choose different line
  breaks. Front a tab, reload it, capture it, then front the other one.
- The baseline worktree installs from its own lockfile, so a dependency that
  changed version during the migration can produce differences this harness will
  report as if they were ours.
