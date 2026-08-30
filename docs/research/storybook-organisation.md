# Storybook organisation: what the docs actually say

Research notes, written 2026-08-30, against **Storybook 10.5.5** (the version
installed in this repo). Sources are limited to the official docs, the
`storybookjs/storybook` repository at tag `v10.5.5`, `MIGRATION.md`, GitHub
release notes, and the first-party addon packages. Live doc links point at
`storybook.js.org/docs/...`, which currently serves the 10.5 docs; where exact
wording or behaviour matters, the same content is also linked as a file at tag
`v10.5.5` so the citation stays pinned. This file is **evidence, not a
decision**: where a practice would require changing this repo it is recorded as
a neutral observation, and where the docs say nothing it says "docs are silent
on this" rather than guessing.

---

## 1. Story taxonomy — titles, hierarchy, co-location, ordering

**Two ways to place a story, and they are named.** "there are two methods of
structuring your stories: **implicit** and **explicit**. The implicit method
involves relying upon the physical location of your stories to position them in
the sidebar, while the explicit method involves utilizing the `title` parameter
to place the story."
([naming-components-and-hierarchy#structure-and-hierarchy](https://storybook.js.org/docs/writing-stories/naming-components-and-hierarchy#structure-and-hierarchy),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/writing-stories/naming-components-and-hierarchy.mdx))
The docs do **not** rank the two methods against each other — docs are silent on
which to prefer.

**Named parts of the hierarchy.** Category (top-level grouping) → Folder →
Component → Docs → Story
([same page](https://storybook.js.org/docs/writing-stories/naming-components-and-hierarchy#structure-and-hierarchy)).
Groups are created with `/` as a separator, e.g. `'Design System/Atoms/Button'`
([#grouping](https://storybook.js.org/docs/writing-stories/naming-components-and-hierarchy#grouping)).

**Grouping depth.** No maximum or recommended depth is stated. The only depth
signal in the API is that `storySort.order` "can accept a nested array to sort
2nd-level story kinds"
([#sorting-stories](https://storybook.js.org/docs/writing-stories/naming-components-and-hierarchy#sorting-stories)).
Docs are silent on grouping depth as a rule.

**Naming recommendation.** "if you have a large Storybook composed of multiple
component stories, we recommend naming your components according to the file
hierarchy"
([#roots](https://storybook.js.org/docs/writing-stories/naming-components-and-hierarchy#roots)),
and more explicitly: "We recommend using a nesting scheme that mirrors the
filesystem path of the components. For example, if you have a file
`components/modals/Alert.js`, name the CSF file `components/modals/Alert.stories.js`
and title it `Components/Modals/Alert`."
([sidebar-and-urls](https://storybook.js.org/docs/configure/user-interface/sidebar-and-urls),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/configure/user-interface/sidebar-and-urls.mdx))

**Co-locating stories next to components — this is the documented default.**
"A component's stories are defined in a story file that lives alongside the
component file"
([writing-stories#where-to-put-stories](https://storybook.js.org/docs/writing-stories#where-to-put-stories)),
and the `stories` config reference says "The intention is for you to colocate a
story file along with the component it documents"
([main-config-stories](https://storybook.js.org/docs/api/main-config/main-config-stories),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/api/main-config/main-config-stories.mdx)).
A separate story tree is never described as an alternative — docs are silent on
a separate-tree layout.

**Glob ordering vs explicit `title`.** These control different things and the
docs keep them separate:

- Glob order controls **load order**: "Stories are loaded in the order they are
  defined in the array. This allows you to control the order in which stories
  are displayed in the sidebar"
  ([main-config-stories#with-an-array-of-globs](https://storybook.js.org/docs/api/main-config/main-config-stories#with-an-array-of-globs)).
- Sidebar order default: "Out of the box, Storybook sorts stories based on the
  order in which they are imported"
  ([#sorting-stories](https://storybook.js.org/docs/writing-stories/naming-components-and-hierarchy#sorting-stories)).
- `title` controls **placement in the tree**, not order. With explicit titles,
  glob order still determines sibling order unless `storySort` is set. The docs
  never state this interaction in one place — that combination is inference from
  the two quotes above, and the docs are silent on it directly.

**`storySort` in v10** lives at `parameters.options.storySort` in `preview.*`
and accepts either a comparator function or a configuration object
([#sorting-stories](https://storybook.js.org/docs/writing-stories/naming-components-and-hierarchy#sorting-stories)):

| Field          | Type    | Default                 | Notes                                                                        |
| -------------- | ------- | ----------------------- | ---------------------------------------------------------------------------- |
| `method`       | String  | Storybook configuration | `'alphabetical'`                                                             |
| `order`        | Array   | `[]`                    | Nested arrays sort 2nd-level kinds; `'*'` marks where "all other stories" go |
| `includeNames` | Boolean | `false`                 | Include story name in sort calculation                                       |
| `locales`      | String  | System locale           | e.g. `en-US`                                                                 |

"the `order` option is independent of the `method` option; stories are sorted
first by the `order` array and then by either the `method: 'alphabetical'` or the
default `configure()` import order." The comparator receives entries typed
`IndexEntry`, and "Asides from the unique story identifier, you can also use the
`title`, `name`, and import path to sort your stories"
([source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/_snippets/storybook-preview-sort-function.md)).

**Roots and permalinks.** Top-level nodes render as non-expandable "roots"
unless `sidebar.showRoots: false` is set in `manager.*`
([sidebar-and-urls#roots](https://storybook.js.org/docs/configure/user-interface/sidebar-and-urls#roots)).
Story `id` derives from title + story name (`Foo/Bar` + `Baz` → `foo-bar--baz`)
and can be pinned with `id` to survive renames
([#permalink-to-stories](https://storybook.js.org/docs/configure/user-interface/sidebar-and-urls#permalink-to-stories)).
Titles must be **statically analysable**: "The _default_ export must contain a
`title` property that can be read statically or a `component` property from which
an automatic title can be computed"
([writing-stories#default-export](https://storybook.js.org/docs/writing-stories#default-export)).

**Observation about this repo.** All 35 story files use explicit `title`s that do
not mirror the FSD filesystem layout (e.g. `src/6-shared/ui/Chip.stories.tsx` →
`UI/Chip`; `src/3-widgets/account/AccountList.stories.tsx` → `Finance/Accounts`).
The files are co-located with components, which matches the documented default;
the titles are the explicit method, which the docs also support but for which
they recommend mirroring the file hierarchy. No `storySort` is configured, so
sidebar order within a group is glob/import order.

---

## 2. Args and argTypes vs render-only stories

**Documented role of `args`.** "A story is a component with a set of arguments
that define how the component should render. 'Args' are Storybook's mechanism for
defining those arguments in a single JavaScript object… When an arg's value
changes, the component re-renders, allowing you to interact with components in
Storybook's UI via addons that affect args."
([args](https://storybook.js.org/docs/writing-stories/args),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/writing-stories/args.mdx))
Args compose at story / component / global level
([#args-object](https://storybook.js.org/docs/writing-stories/args#args-object)).

**Documented role of `argTypes`.** "ArgTypes specify the behavior of args. By
specifying the type of an arg, you constrain the values that it can accept and
provide information about args that are not explicitly set… The most concrete
realization of argTypes is the `ArgTypes` doc block (`Controls` is similar). Each
row in the table corresponds to a single argType and the current value of that
arg."
([arg-types](https://storybook.js.org/docs/api/arg-types),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/api/arg-types.mdx))

**How controls get inferred.** "If you are using the Storybook docs addon, then
Storybook will infer a set of argTypes for each story based on the `component`
specified in the meta (or default export) of the CSF file."
([#automatic-argtype-inference](https://storybook.js.org/docs/api/arg-types#automatic-argtype-inference)).
For React the tool is `react-docgen` by default, or `react-docgen-typescript`
([same table](https://storybook.js.org/docs/api/arg-types#automatic-argtype-inference);
[main-config-typescript#reactdocgen](https://storybook.js.org/docs/api/main-config/main-config-typescript#reactdocgen)).
"Properties specified manually will override what is inferred."

The controls page is blunter: "To enable them, add the `component` annotation to
the meta (or default export) of your story file, and it will be used to infer the
controls and auto-generate the matching `argTypes`"
([controls#choosing-the-control-type](https://storybook.js.org/docs/essentials/controls#choosing-the-control-type),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/essentials/controls.mdx)).
The source is unambiguous — with no `component`, nothing is extracted:

```ts
// code/core/src/docs-tools/argTypes/enhanceArgTypes.ts
if (!extractArgTypes || !component) {
  return userArgTypes
}
```

([enhanceArgTypes.ts @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/code/core/src/docs-tools/argTypes/enhanceArgTypes.ts))

**What breaks inference (documented).**

- No `component` on the meta (source above).
- `react-docgen` "performs its own analysis, which is much faster but incomplete"
  ([main-config-typescript#reactdocgen](https://storybook.js.org/docs/api/main-config/main-config-typescript#reactdocgen)).
- Named cases: "you may run into a situation where some options may not work as
  expected (e.g., `Enums`, React's `forwardRef`). This is primarily due to how the
  `react-docgen` package is implemented" — the documented fix is switching to
  `react-docgen-typescript`
  ([typescript#the-types-are-not-being-generated-for-my-component](https://storybook.js.org/docs/configure/integration/typescript#the-types-are-not-being-generated-for-my-component)).
- Third-party library types not resolving; and, with `react-docgen-typescript` in
  a workspace monorepo, "components imported from a workspace package are missing
  inherited args"
  ([typescript#inherited-args-are-missing-for-components-from-workspace-packages](https://storybook.js.org/docs/configure/integration/typescript#inherited-args-are-missing-for-components-from-workspace-packages)).
- Complex/JSX arg values cannot be serialised to the manager; `argTypes.mapping`
  is the documented workaround
  ([args#mapping-to-complex-arg-values](https://storybook.js.org/docs/writing-stories/args#mapping-to-complex-arg-values)).

**What the docs say about stories that ignore args.** There is no page that
addresses "render-only stories" head on — docs are silent on that framing. The
adjacent statements are:

- "Note how the `render` function spreads `args` onto the Button component. This
  ensures that features like Controls will work as expected"
  ([writing-stories#custom-rendering](https://storybook.js.org/docs/writing-stories#custom-rendering)).
- On React hooks inside stories: "you should treat them as an advanced use case.
  We **recommend** args as much as possible when writing your own stories"
  ([writing-stories, Working with React Hooks](https://storybook.js.org/docs/writing-stories#working-with-react-hooks)).
- On multi-component stories: "there are disadvantages in writing stories like
  this as you cannot take full advantage of the args mechanism and composing args"
  ([writing-stories#stories-for-two-or-more-components](https://storybook.js.org/docs/writing-stories#stories-for-two-or-more-components)).

**First-party guidance on "showcase / all-variants" stories — yes, one recipe
exists, and it lives in the tags docs.** Under "Combo stories, still tested
individually": "For a component with many variants, like a Button, a grid of
those variants all together can be a helpful way to visualize it. But you may
wish to test the variants individually."
([tags#combo-stories-still-tested-individually](https://storybook.js.org/docs/writing-stories/tags#combo-stories-still-tested-individually),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/writing-stories/tags.mdx)).
The shipped snippet keeps **both** shapes in one file — args-driven per-variant
stories hidden from the sidebar and docs, plus one render-only grid excluded from
tests
([tags-combo-example.md @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/_snippets/tags-combo-example.md)):

```tsx
export const Variant1: Story = {
  tags: ['!dev', '!autodocs'],
  args: { variant: 1 },
}
export const Variant2: Story = {
  tags: ['!dev', '!autodocs'],
  args: { variant: 2 },
}
export const Combo: Story = {
  tags: ['!test'],
  render: () => (
    <>
      <Button variant={1} />
      <Button variant={2} />
    </>
  ),
}
```

A second first-party signal: a `manager.ts` snippet in the layout docs branches on
custom tags named exactly `showcase` and `kitchensink` — "Hide the panel on
stories designed to showcase multiple variants or usage examples"
([storybook-manager-addon-panel-hide-on-showcase.md @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/_snippets/storybook-manager-addon-panel-hide-on-showcase.md),
used by
[features-and-behavior#configure-the-addon-panel](https://storybook.js.org/docs/configure/user-interface/features-and-behavior#configure-the-addon-panel)).

**Where the docs put gallery-style content instead.** Doc blocks exist
specifically for gallery documentation and they are documentation-page blocks,
not stories: `ColorPalette` ("document all color-related items (e.g., swatches)
used throughout your project"), `IconGallery` ("document all icons associated
with your project, displayed in a neat grid"), and `Typeset`
([doc-blocks#available-blocks](https://storybook.js.org/docs/writing-docs/doc-blocks#available-blocks)).
For grouping components that belong together, "If you want to organize your
documentation differently for component groups, we recommend using MDX. It gives
you complete control over how your components are displayed"
([autodocs#documenting-multiple-components](https://storybook.js.org/docs/writing-docs/autodocs#documenting-multiple-components)).
Beyond that, docs are silent on whether an all-variants view "should" be a story
or an MDX page.

**Observation about this repo.** 0 of 35 story files declare `argTypes`; 4 set
`args`; 9 set `component`. Most stories are `render: () => <Showcase/>` with no
args spread. Per `enhanceArgTypes`, the 26 files without `component` cannot
produce an inferred props table at all. The docs' own combo recipe pairs a grid
with per-variant arg stories rather than replacing them.

---

## 3. Autodocs

**Mechanism.** "Autodocs is configured through tags. If a CSF file contains at
least one story tagged with `autodocs`, then a documentation page will be
generated for that component."
([autodocs#set-up-automated-documentation](https://storybook.js.org/docs/writing-docs/autodocs#set-up-automated-documentation),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/writing-docs/autodocs.mdx))
The page is "positioned at the root-level of your component tree in the sidebar"
([autodocs, intro](https://storybook.js.org/docs/writing-docs/autodocs)).

**Where the tag can be set.** Project (`.storybook/preview.*`), component (meta),
or story level — all three are shown on the autodocs page and in
[tags#applying-tags](https://storybook.js.org/docs/writing-stories/tags#applying-tags).
`autodocs` is **not** applied by default
([tags#built-in-tags](https://storybook.js.org/docs/writing-stories/tags#built-in-tags)).

**Opting out.** Prefix with `!`. `tags: ['!autodocs']` on a meta disables the
docs page for that component; on a story it removes just that story from the
generated page
([autodocs#set-up-automated-documentation](https://storybook.js.org/docs/writing-docs/autodocs#set-up-automated-documentation),
[tags-autodocs-remove-story.md @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/_snippets/tags-autodocs-remove-story.md)).

**Does the props table need `component` on the meta?** The docs never say this in
one sentence — that specific claim is **not** stated outright, so on the letter
of the docs this is silent. What _is_ stated is the chain: the default template's
third block is "An interactive table with all the relevant `args` and `argTypes`
defined in the story via the `Controls` Doc Block"
([autodocs#write-a-custom-template](https://storybook.js.org/docs/writing-docs/autodocs#write-a-custom-template)),
and argTypes are "inferred… based on the `component` specified in the meta"
([arg-types#automatic-argtype-inference](https://storybook.js.org/docs/api/arg-types#automatic-argtype-inference)).
The source closes the gap: no `component` ⇒ `enhanceArgTypes` returns only
user-written argTypes
([enhanceArgTypes.ts @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/code/core/src/docs-tools/argTypes/enhanceArgTypes.ts)).
A docs page is still generated without `component`; it just has nothing to fill
the table with.

**Default page contents.** Title / Subtitle / Description blocks, the `Primary`
block (first story), the `Controls` block, then the `Stories` block for the rest
([autodocs#write-a-custom-template](https://storybook.js.org/docs/writing-docs/autodocs#write-a-custom-template)).
Configurable via `docs.defaultName` and `docs.docsMode` in `main.*`, `docs.toc`
parameters, a custom `docs.page` template, a custom `docs.container`, and
`docs.theme` (see §7)
([autodocs#configure](https://storybook.js.org/docs/writing-docs/autodocs#configure)).

**Relationship to `argTypes`.** "Storybook infers the relevant metadata (e.g.,
`args`, `argTypes`, `parameters`) and automatically generates a documentation
page"
([autodocs, intro](https://storybook.js.org/docs/writing-docs/autodocs)).
`subcomponents` adds tabs to the `ArgTypes` block, with the caveat that
subcomponent argTypes "are inferred… and cannot be manually defined or
overridden" and get no controls
([stories-for-multiple-components#subcomponents](https://storybook.js.org/docs/writing-stories/stories-for-multiple-components#subcomponents)).

**Observation about this repo.** `tags: ['autodocs']` is set project-wide in
`.storybook/preview.tsx`, so every one of the 35 files generates a Docs page,
including the 25 without `component`. Nothing opts out with `!autodocs`.

---

## 4. CSF factories / `defineMeta`

**Naming.** In 10.5.5 the docs call this **"CSF Next"** (tab title "CSF Next
(Preview)"); the release notes and the automigration call it **"CSF factories"**.
Same thing.
([api/csf/csf-next](https://storybook.js.org/docs/api/csf/csf-next),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/api/csf/csf-next.mdx))

**Status: Preview, not stable.** The page carries a warning callout: "This is a
**preview** feature and (though unlikely) the API may change in future releases."
And Storybook's own lifecycle definition of Preview: "Preview features are nearly
production-ready and generally reliable… These features are suitable for use in
real projects… While the feature is stable in direction, we may introduce minimal
breaking changes in minor releases to address gaps or refine behavior… We aim to
collect feedback and iterate for 1-2 minor releases before promoting to stable."
([releases/features#preview](https://storybook.js.org/docs/releases/features#preview),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/releases/features.mdx))
It is not described anywhere as _recommended_; the FAQ says the opposite about
urgency: "Storybook will continue to support CSF 1, CSF 2, and CSF 3 for the
foreseeable future. None of these prior formats are deprecated."
([csf-next#will-i-have-to-migrate-all-of-my-stories-to-this-new-format](https://storybook.js.org/docs/api/csf/csf-next#will-i-have-to-migrate-all-of-my-stories-to-this-new-format))

**Renderer support.** Shipped as "Typesafe CSF factories Preview for React" in
10.0.0 and extended in 10.2.0: "Typesafe CSF factories for Vue, Angular, Web
Components (preview)"
([v10.0.0 release notes](https://github.com/storybookjs/storybook/releases/tag/v10.0.0),
[v10.2.0 release notes](https://github.com/storybookjs/storybook/releases/tag/v10.2.0)).
The 10.5.5 doc lists React, Vue, Angular, Web Components.

**Note on `defineMeta`.** In this API the functions are `defineMain`,
`definePreview`, `preview.meta(...)`, `meta.story(...)`. `defineMeta` is the
**Svelte CSF** function, from the community `@storybook/addon-svelte-csf` package
— not part of CSF Next
([writing-stories, Svelte branch](https://storybook.js.org/docs/writing-stories)).
Not applicable to a React project.

**What it changes.**

- `main.ts` becomes `export default defineMain({...})` from
  `@storybook/your-framework/node`.
- `preview.ts` becomes `export default definePreview({ addons: [addonA11y()], ... })`
  — "by specifying addons here, their types will be available throughout your
  project, enabling autocompletion and type checking."
- Story files import the preview: `const meta = preview.meta({ component: Button })`;
  the meta is no longer a default export; stories become `meta.story({...})`.
- "importing or manually applying the component props type to the meta or stories
  is no longer necessary… the types are now inferred automatically" — i.e. no more
  `satisfies Meta<typeof X>` / `StoryObj<typeof meta>`.
- `Story.extend({...})` composes stories, with documented merge semantics: args
  shallow-merged, parameters deep-merged (arrays replaced), decorators and tags
  concatenated.

([csf-next#overview](https://storybook.js.org/docs/api/csf/csf-next#overview),
[#upgrade-to-csf-next](https://storybook.js.org/docs/api/csf/csf-next#upgrade-to-csf-next))

**Migration path.** `npx storybook automigrate csf-factories` upgrades CSF 3 →
CSF Next across the project (CSF 2 must first go through
`migrate csf-2-to-3`)
([csf-next#automatically](https://storybook.js.org/docs/api/csf/csf-next#automatically),
[csf-factories-automigrate.md @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/_snippets/csf-factories-automigrate.md)).
`main.*` and `preview.*` must be converted before any story file.

**Caveats, all documented.**

- "CSF Next is designed to be usable incrementally; you do not have to upgrade all
  of your story files at once. However, **you cannot mix story formats within the
  same file**."
- Absolute imports of the preview are recommended over relative ones ("Relative
  imports can break if you move story files around"), via subpath imports
  (`#.storybook/preview`) or a builder alias.
- Reading another story's properties directly (`Primary.args`) "is still
  supported, [but] it is deprecated in CSF Next" — use `Primary.composed.args`
  (or `Story.input` for the raw input).
- Vitest: "If you use a mix of CSF 1, 2, or 3 and CSF Next, you must maintain two
  separate setup files."
- Custom/extended arg types need `preview.type<{ args: CustomProps }>().meta({...})`.
- `Story.test(...)` is separately marked "⚠️ **Experimental**" and gated behind
  the `experimentalTestSyntax` feature flag — a different, lower status than the
  rest of CSF Next.

([csf-next](https://storybook.js.org/docs/api/csf/csf-next))

**Observation about this repo.** All story files are CSF 3 with
`satisfies Meta` + `StoryObj`; `main.ts` and `preview.tsx` use the
`StorybookConfig` / `Preview` type style. Adopting CSF Next would mean converting
`main.ts` and `preview.tsx` first and would remove the current `Meta`/`StoryObj`
type imports.

---

## 5. Theme switching — `@storybook/addon-themes` vs hand-rolled `globalTypes`

**Is addon-themes alive for Storybook 10? Yes.** The package directory exists at
`code/addons/themes` in the v10.5.5 tag
([tree @ v10.5.5](https://github.com/storybookjs/storybook/tree/v10.5.5/code/addons/themes)),
and npm `@storybook/addon-themes@latest` is `10.5.10` (published 2026-08-20) with
`peerDependencies: { storybook: "^10.5.10" }`. It is versioned in lockstep with
core. It is a **separately installed** addon, not bundled.

**But it is not an "essential".** The Essentials index lists exactly: Actions,
Backgrounds, Controls, Highlight, Measure & outline, Toolbars & globals, Viewport
([essentials](https://storybook.js.org/docs/essentials),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/essentials/index.mdx)).
Themes is absent from that list, even though its page sits at
`/docs/essentials/themes`. The page's own frontmatter at v10.5.5 is
`draft: true`
([essentials/themes.mdx @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/essentials/themes.mdx)),
while the URL still resolves and renders. Read that as: the addon is maintained,
its doc page is marked draft and is not linked from the essentials index.

**The three decorators** (documented in the package, not on the docs site — the
site page just links out):

| Decorator                  | For                                                                       | Key options                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `withThemeFromJSXProvider` | libraries that theme through a provider (MUI, styled-components, Emotion) | `themes`, `defaultTheme`, `Provider`, `GlobalStyles`                                                                             |
| `withThemeByClassName`     | theme selected by a class on a parent element                             | `themes` (name → class), `defaultTheme`, `parentSelector` (default `"html"`)                                                     |
| `withThemeByDataAttribute` | theme selected by a data attribute                                        | `themes` (name → attribute value), `defaultTheme`, `parentSelector` (default `"html"`), `attributeName` (default `"data-theme"`) |

([addon-themes docs/api.md @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/code/addons/themes/docs/api.md),
mirrored at [essentials/themes](https://storybook.js.org/docs/essentials/themes))
Escape hatch for anything else: `DecoratorHelpers.pluckThemeFromContext` /
`initializeThemeState`, under "Writing a custom decorator" (same file).
`useThemeParameters` is marked "⛔️ **Deprecated**".

**Hand-rolled `globalTypes` + decorator is also first-party documented** — it is
the worked example on the Toolbars & globals page: declare `globalTypes.theme`
with a `toolbar` annotation, then "consume our new `theme` global in a decorator
using the `context.globals.theme` value"
([toolbars-and-globals](https://storybook.js.org/docs/essentials/toolbars-and-globals),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/essentials/toolbars-and-globals.mdx)).
A third documented variant reads a **parameter** instead of a global, in the
mock-provider recipe: "if you imagine a scenario where you wish to create stories
for each of your components in both light and dark themes, this approach can
quickly become cumbersome… use the decorator function's second 'context' argument
to access a story's parameters"
([mocking-providers#configuring-the-mock-provider](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-providers#configuring-the-mock-provider)).

**Is there a first-party recommendation between them? No.** No page says "prefer
the addon" or "prefer globalTypes". The only nudge in either direction is in the
styling guide, for CSS-in-JS specifically: libraries that "expect components to
render in a specific rendering 'context' (for example, to provide themes)… can be
accomplished with `@storybook/addon-themes`'s `withThemeFromJSXProvider`
decorator"
([styling-and-css](https://storybook.js.org/docs/configure/styling-and-css)).
Beyond that, docs are silent on the choice.

**One collision worth knowing.** addon-themes claims the global key `theme`:

```ts
// code/addons/themes/src/constants.ts
export const GLOBAL_KEY = 'theme' as const
```

([constants.ts @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/code/addons/themes/src/constants.ts))
and registers its own toolbar tool via `addons.register` in the manager rather
than through `globalTypes`
([manager.tsx @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/code/addons/themes/src/manager.tsx)),
with `initialGlobals: { theme: '' }` in its preview entry
([preview.ts @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/code/addons/themes/src/preview.ts)).
The addon's decorators only touch the **preview** (a class or attribute on
`html`, or a JSX provider); nothing in the package touches the manager chrome
theme. Docs are silent on what happens if a project declares its own
`globalTypes.theme` and also installs addon-themes.

**Observation about this repo.** `.storybook/preview.tsx` declares
`globalTypes.theme` with a paintbrush toolbar, and `StoryProviders` both passes
the theme into the app's own `Providers` and sets
`document.documentElement.dataset.zerroStorybookTheme`. That is the hand-rolled
pattern the toolbars page documents, plus a data attribute that
`withThemeByDataAttribute` would otherwise set (its default attribute is
`data-theme`, configurable). The repo's global key is `theme`, the same key
addon-themes claims.

---

## 6. Per-story theme overrides

**`globals` on a story or meta is the supported v10 API.** "To ensure that a
story always uses a specific global value, regardless of what has been chosen in
the toolbar, you can set the `globals` annotation on a story or component. This
overrides the global value for those stories and **disables the toolbar menu for
that global** when viewing the stories."
([toolbars-and-globals#setting-globals-on-a-story](https://storybook.js.org/docs/essentials/toolbars-and-globals#setting-globals-on-a-story))
The types confirm it at both levels — `ComponentAnnotations.globals` ("Override
the globals values for all stories in this component") and
`StoryAnnotations.globals` ("Override the globals values for this story") — in
the installed `storybook@10.5.5` (`dist/csf/index.d.ts`, lines 2026-2037).
addon-themes documents the same shape for its own global:
`globals: { theme: 'dark' }` at meta or story level
([addon-themes README @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/code/addons/themes/README.md)).

**History, so the older `parameters` form can be ruled out.** Story-level
`globals` arrived in 8.3 for viewport/backgrounds behind the
`viewportStoryGlobals` / `backgroundsStoryGlobals` feature flags, replacing
`parameters.backgrounds.default`: "Setting an override value should now be done
via a `globals` property on your component/meta or story itself… This locks that
story to the `twitter` background, it cannot be changed by the addon UI."
([MIGRATION.md, 8.2.x→8.3.x](https://github.com/storybookjs/storybook/blob/v10.5.5/MIGRATION.md#new-parameters-format-for-addon-backgrounds))
Those flags were removed in 9.0 as the behaviour became standard
([MIGRATION.md, 8.x→9.0.0](https://github.com/storybookjs/storybook/blob/v10.5.5/MIGRATION.md#viewportbackgrounds-addon-synchronized-configuration-and-globals-usage)).
So in v10 `globals` is the API and the `parameters` form is historical. Note the
CSF API reference page itself never mentions `globals`
([api/csf](https://storybook.js.org/docs/api/csf)) — the documented home for it is
the toolbars page.

**Is duplicating a story to make a dark twin called out as an anti-pattern?**
Not by that name — docs are silent on story duplication specifically. Two
adjacent warnings exist:

- "Configuring a story's `globals` annotation to override the project-level global
  settings is useful but **should be used with moderation**. Globals that are not
  defined at the story level can be selected interactively in Storybook's UI,
  allowing users to explore every existing combination of values… Setting them at
  the story level will disable that control, preventing users from exploring the
  available options."
  ([toolbars-and-globals#setting-globals-on-a-story](https://storybook.js.org/docs/essentials/toolbars-and-globals#setting-globals-on-a-story))
- The mock-provider page names the cost of the pattern directly: creating stories
  "for each of your components in both light and dark themes… can quickly become
  cumbersome"
  ([mocking-providers#configuring-the-mock-provider](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-providers#configuring-the-mock-provider)).

**Rendering both themes side by side: no first-party feature.** Nothing in the
v10 docs, and nothing in `@storybook/addon-themes` (its manager tool is a single
`Select`,
[theme-switcher.tsx @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/code/addons/themes/src/theme-switcher.tsx)),
renders two themes at once. Docs are silent on side-by-side theme rendering. The
only mechanism available is an ordinary decorator, which "is a way to wrap a story
in extra 'rendering' functionality"
([decorators](https://storybook.js.org/docs/writing-stories/decorators)) — the docs
never show one rendering the story twice.

**Testing both themes without duplicating stories: yes, and it is new in 10.5.**
The Vitest addon gained an `initialGlobals` plugin option — "Configures a set of
initial global values that will be applied to every story this project runs.
Useful for running tests with different options, such as testing every story in a
specific theme. It can be further configured with multiple Vitest projects, each
pinning a different global value." The shipped example builds one Vitest project
per theme (`storybook-light`, `storybook-dark`) so "every story is tested in both"
([vitest-addon#initialglobals](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon#initialglobals),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/writing-tests/integrations/vitest-addon/index.mdx)).
Announced as "🌈 Vitest initialGlobals: Test across themes, viewports, locales"
([v10.5.0 release notes](https://github.com/storybookjs/storybook/releases/tag/v10.5.0)).

Caveat the docs do **not** state: story-level globals still win over that. The
docs only say "the plugin's own values always take precedence over Storybook's own
values" (i.e. over `preview.initialGlobals`). In source, the composition is
`globals: { ...userGlobals, ...story.storyGlobals }`
([StoryStore.ts @ v10.5.5, ~line 267](https://github.com/storybookjs/storybook/blob/v10.5.5/code/core/src/preview-api/modules/store/StoryStore.ts)),
with `storyGlobals = { ...componentAnnotations.globals, ...storyAnnotations.globals }`
([prepareStory.ts @ v10.5.5, ~line 244](https://github.com/storybookjs/storybook/blob/v10.5.5/code/core/src/preview-api/modules/store/csf/prepareStory.ts)).
So a story pinned with `globals: { theme: 'dark' }` stays dark in a light-pinned
Vitest project. Docs are silent on this interaction.

**Observation about this repo.** 18 story files contain
`globals: { theme: 'dark' }`, mostly as a spread twin of an existing story
(`export const DarkShowcase: Story = { ...Showcase, globals: { theme: 'dark' } }`).
That is the documented API used exactly as documented, at the cost the toolbars
page names (toolbar locked for those stories). `vitest.storybook.config.ts`
currently defines a single project with no `initialGlobals`.

---

## 7. Manager theming and flicker

**`addons.setConfig()` is documented as a call in the manager config file, once.**
"To control the layout of Storybook's UI you can use `addons.setConfig` in your
`.storybook/manager.js`"
([features-and-behavior](https://storybook.js.org/docs/configure/user-interface/features-and-behavior),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/configure/user-interface/features-and-behavior.mdx));
"This method allows you to override the default Storybook UI configuration (e.g.,
set up a theme or hide UI elements)"
([addons-api#addonssetconfigconfig](https://storybook.js.org/docs/addons/addons-api#addonssetconfigconfig)).
`theme` is listed as an `Object` in the config table. **Repeated / runtime calls
are neither endorsed nor forbidden — docs are silent on calling `setConfig` more
than once.**

**What the source does.** `setConfig` merges into a persistent config object and
re-emits `SET_CONFIG` on the channel every time it is called:

```ts
setConfig = (value: Addon_Config) => {
  Object.assign(this.config, value)
  if (this.hasChannel()) this.getChannel().emit(SET_CONFIG, this.config)
  else this.ready().then(channel => channel.emit(SET_CONFIG, this.config))
}
```

([manager-api/lib/addons.ts @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/code/core/src/manager-api/lib/addons.ts))
The layout module subscribes and re-applies options on every `SET_CONFIG`, and
its `setOptions` computes `updatedTheme = { ...theme, ...options.theme }`, writing
state only when the result differs
([manager-api/modules/layout.ts @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/code/core/src/manager-api/modules/layout.ts)).
So runtime re-theming does propagate — as observed source behaviour, not as a
documented contract. Note the merge is with the _current_ theme, which is why the
docs say "When setting a theme, set a complete theme object. The theme is
replaced, not combined."
([theming#global-theming](https://storybook.js.org/docs/configure/user-interface/theming#global-theming));
a key present in one built-in theme but absent from the other would survive a
swap.

**Manager default theme in v10 follows the OS.** "The built-in themes are light,
dark, and the 'normal' theme that matches your preferred color scheme. Unless you
specify otherwise, Storybook uses the normal theme by default."
([theming#global-theming](https://storybook.js.org/docs/configure/user-interface/theming#global-theming))
Source: `themes.normal = themesBase[preferredColorScheme]`, resolved once at
module evaluation
([theming/create.ts @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/code/core/src/theming/create.ts)).

**Docs pages are themed separately from the manager.** "Storybook Docs uses the
same theme system as Storybook's UI but is themed independently from the main UI.
The default theme for Docs is always the 'light' theme, regardless of the main UI
theme." The documented way to change it is `parameters.docs.theme` in `preview.*`
([theming#theming-docs](https://storybook.js.org/docs/configure/user-interface/theming#theming-docs),
[storybook-preview-docs-dark-theme.md @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/_snippets/storybook-preview-docs-dark-theme.md)).
For CSS beyond the theme API: "The Storybook theme API is narrow by design. If you
want to have fine-grained control over the CSS, all UI and Docs components are
tagged with class names to make this possible. **Use at your own risk**… For
Storybook's UI, use `.storybook/manager-head.html`; For Storybook Docs, use
`.storybook/preview-head.html`", with the caution that "Storybook's inner HTML can
change at any time through the release cycle"
([theming#css-escape-hatches](https://storybook.js.org/docs/configure/user-interface/theming#css-escape-hatches)).

**Official way to sync manager chrome to a preview-side theme global: there is
none.** No page describes a manager↔preview theme sync, and no API is exposed for
it. Docs are silent on this. What the docs _do_ say is that the manager theme is
configured statically in `manager.*` and that Docs is themed via a preview
parameter — two separate, static settings.

**Preview iframe remounts on story navigation.** Docs are silent on this. The
only nearby statement is about story lifecycle, not iframe reloads: a `beforeEach`
cleanup "will run **after** each story, when the story is remounted or navigated
away from"
([interaction-testing](https://storybook.js.org/docs/writing-tests/interaction-testing)).
In source, navigation is a channel event handled inside the already-loaded preview
(`this.channel.on(SET_CURRENT_STORY, this.onSetCurrentStory…)`,
[PreviewWithSelection.tsx @ v10.5.5](https://github.com/storybookjs/storybook/blob/v10.5.5/code/core/src/preview-api/modules/preview-web/PreviewWithSelection.tsx)),
so the iframe document is not reloaded per story — again, source behaviour, not a
documented contract.

**Observation about this repo.** `.storybook/manager.ts` calls `applyTheme()` at
module load (defaulting to `light`, overriding v10's OS-following `normal`) and
then again on each `postMessage` from `StoryProviders`. Both the repeated
`setConfig` and the manager↔preview message channel are outside anything the docs
describe. `.storybook/preview.css` styles `.sbdocs*` / `.sb-*` class names with
`!important` — the class-name escape hatch the theming page documents, though the
documented injection point for Docs CSS is `.storybook/preview-head.html` rather
than a CSS import from `preview.tsx`, and `parameters.docs.theme` is the
documented knob for the Docs theme itself.

---

## 8. Tags-based organisation

**Built-in tags in v10** ([tags#built-in-tags](https://storybook.js.org/docs/writing-stories/tags#built-in-tags),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/writing-stories/tags.mdx)):

| Tag        | Default? | Meaning                                                                                   |
| ---------- | -------- | ----------------------------------------------------------------------------------------- |
| `dev`      | yes      | rendered in Storybook's sidebar                                                           |
| `manifest` | yes      | included in component/docs manifests — at v10.5.5 the table says "(Currently React-only)" |
| `test`     | yes      | included in test-runner or Vitest addon runs                                              |
| `autodocs` | no       | included in the docs page                                                                 |
| `play-fn`  | no       | applied automatically to stories with a play function                                     |
| `test-fn`  | no       | applied automatically to tests defined with the experimental `.test` method               |

"The `dev`, `manifest`, and `test` tags are automatically, implicitly applied to
every story in your Storybook project."

**Levels and removal.** Tags apply at project (`preview.*`), component (meta), or
story level, and inherit downward; "To remove a tag from a story, prefix it with
`!`" — removal also works at project and component level
([#applying-tags](https://storybook.js.org/docs/writing-stories/tags#applying-tags),
[#removing-tags](https://storybook.js.org/docs/writing-stories/tags#removing-tags)).
Tags must be static strings: "A tag can be any static (i.e. not created
dynamically) string". Docs are silent on any precedence rule beyond
project → component → story inheritance.

**Custom tags.** Two ways to create one: just apply it, or declare it in
`main.*` for extra configuration. Suggested axes: "Status, such as `experimental`,
`new`, `stable`, or `deprecated`", "User persona", "Component/code ownership"
([#custom-tags](https://storybook.js.org/docs/writing-stories/tags#custom-tags)).
The `main.*` `tags` field is typed
`{ [tagName: string]: { defaultFilterSelection?: 'include' | 'exclude' } }`
([main-config-tags](https://storybook.js.org/docs/api/main-config/main-config-tags),
[source](https://github.com/storybookjs/storybook/blob/v10.5.5/docs/api/main-config/main-config-tags.mdx)).

**Sidebar filtering.** "Both built-in and custom tags are available as filters in
Storybook's sidebar… Selecting multiple tags shows stories that contain any of
those tags." Exclusion is a separate control and can be mixed with inclusion.
"When searching, the filter is applied first, so search results are limited to the
currently filtered tags."
([#filtering-the-sidebar-by-tags](https://storybook.js.org/docs/writing-stories/tags#filtering-the-sidebar-by-tags))

**Excluding stories from test runs.** Two levers. Per story: `tags: ['!test']`.
Per project, in the Vitest plugin: "By default, the plugin will run all stories
with the `test` tag. You can adjust this behavior by providing the `tags`
option… If the same tag is in both the `include` and `exclude` arrays, the
`exclude` behavior takes precedence."
([vitest-addon#including-excluding-or-skipping-tests](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon#including-excluding-or-skipping-tests))

**Documented recipes for organising a library with tags**
([#recipes](https://storybook.js.org/docs/writing-stories/tags#recipes)):

1. **Docs-only stories** — `tags: ['autodocs', '!dev']` on the meta: "appearing
   only in the docs page and not in Storybook's sidebar".
2. **Combo stories, still tested individually** — per-variant stories tagged
   `['!dev', '!autodocs']`, plus one grid story tagged `['!test']` (full snippet
   quoted in §2).
3. **Test cases that don't clutter the sidebar** — configure the experimental
   `_test` tag with `defaultFilterSelection: 'exclude'` in `main.*`.

Beyond these three recipes and the status/persona/ownership examples, docs are
silent on a general taxonomy for organising a component library with tags.

**Observation about this repo.** No story file uses `tags` at all; the only tag in
play is the project-wide `tags: ['autodocs']` in `preview.tsx`. `main.ts` declares
no `tags` field, so there are no custom tags and no default filter selections.

---

## 9. What the v10 migration guide flags for a library organised like this one

From [MIGRATION.md, "From version 9.x to 10.0.0"](https://github.com/storybookjs/storybook/blob/v10.5.5/MIGRATION.md#from-version-9x-to-1000)
(this repo is already on 10.5.5, so these are stated as requirements it must keep
satisfying, not as pending work):

| Item                                                | Requirement                                                                                                | This repo                                                                                                                     |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `main.*` and presets must be valid **ESM**          | no `require`, `__dirname`, `__filename`; extensionless relative imports unsupported in `.js` config        | `.storybook/main.ts` is ESM `export default config`; `vite.storybook.config.ts` already uses `fileURLToPath(import.meta.url)` |
| Local addons must be fully resolved                 | `addons: [import.meta.resolve('./my-addon.ts')]`                                                           | no local addons                                                                                                               |
| Node.js 20.19+ or 22.12+                            | —                                                                                                          | `.nvmrc` is `24`                                                                                                              |
| `moduleResolution` supporting the `types` condition | `bundler`, `node16`, or `nodenext`                                                                         | `tsconfig.json` sets `"moduleResolution": "bundler"`                                                                          |
| `core.builder` must be a fully resolved path        | mostly framework authors                                                                                   | not set                                                                                                                       |
| **Removed x-only builtin tags**                     | `dev-only`, `docs-only`, `test-only` are removed in 10.0; use `dev` / `autodocs` / `test` with `!` removal | no tags used                                                                                                                  |

Later in the 10.x line,
[10.4.0 → 10.5.0](https://github.com/storybookjs/storybook/blob/v10.5.5/MIGRATION.md#from-version-1040-to-1050)
deprecates `ExternalDocs` / `ExternalDocsContainer` (not used here), and
[10.0.0 → 10.1.0](https://github.com/storybookjs/storybook/blob/v10.5.5/MIGRATION.md#from-version-1000-to-1010)
is entirely deprecations of manager **UI components** from
`storybook/internal/components` (`IconButton`, `Tabs`, `TabsState`, `ListItem`,
`TooltipLinkList`, `WithTooltipPure`, several `WithTooltip` props, …) — relevant
only to code that imports Storybook's own UI components, which this repo does not
do; `.storybook/manager.ts` imports only `addons` and `themes`.

**Nothing in any v10 migration section addresses** render-only stories, missing
`argTypes`, project-wide `autodocs`, duplicated theme stories, or repeated
`addons.setConfig` calls. Docs are silent on all of these as migration hazards.

---

## Source index

Docs (Storybook 10.5, live) — [writing-stories](https://storybook.js.org/docs/writing-stories) ·
[args](https://storybook.js.org/docs/writing-stories/args) ·
[decorators](https://storybook.js.org/docs/writing-stories/decorators) ·
[naming-components-and-hierarchy](https://storybook.js.org/docs/writing-stories/naming-components-and-hierarchy) ·
[tags](https://storybook.js.org/docs/writing-stories/tags) ·
[stories-for-multiple-components](https://storybook.js.org/docs/writing-stories/stories-for-multiple-components) ·
[mocking-providers](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-providers) ·
[autodocs](https://storybook.js.org/docs/writing-docs/autodocs) ·
[doc-blocks](https://storybook.js.org/docs/writing-docs/doc-blocks) ·
[arg-types](https://storybook.js.org/docs/api/arg-types) ·
[csf](https://storybook.js.org/docs/api/csf) ·
[csf-next](https://storybook.js.org/docs/api/csf/csf-next) ·
[main-config-stories](https://storybook.js.org/docs/api/main-config/main-config-stories) ·
[main-config-tags](https://storybook.js.org/docs/api/main-config/main-config-tags) ·
[main-config-typescript](https://storybook.js.org/docs/api/main-config/main-config-typescript) ·
[addons-api](https://storybook.js.org/docs/addons/addons-api) ·
[essentials](https://storybook.js.org/docs/essentials) ·
[controls](https://storybook.js.org/docs/essentials/controls) ·
[themes](https://storybook.js.org/docs/essentials/themes) ·
[toolbars-and-globals](https://storybook.js.org/docs/essentials/toolbars-and-globals) ·
[sidebar-and-urls](https://storybook.js.org/docs/configure/user-interface/sidebar-and-urls) ·
[features-and-behavior](https://storybook.js.org/docs/configure/user-interface/features-and-behavior) ·
[theming](https://storybook.js.org/docs/configure/user-interface/theming) ·
[styling-and-css](https://storybook.js.org/docs/configure/styling-and-css) ·
[integration/typescript](https://storybook.js.org/docs/configure/integration/typescript) ·
[vitest-addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon) ·
[releases/features](https://storybook.js.org/docs/releases/features)

Repository at tag `v10.5.5` —
[docs/](https://github.com/storybookjs/storybook/tree/v10.5.5/docs) ·
[MIGRATION.md](https://github.com/storybookjs/storybook/blob/v10.5.5/MIGRATION.md) ·
[code/addons/themes](https://github.com/storybookjs/storybook/tree/v10.5.5/code/addons/themes) ·
[enhanceArgTypes.ts](https://github.com/storybookjs/storybook/blob/v10.5.5/code/core/src/docs-tools/argTypes/enhanceArgTypes.ts) ·
[manager-api/lib/addons.ts](https://github.com/storybookjs/storybook/blob/v10.5.5/code/core/src/manager-api/lib/addons.ts) ·
[manager-api/modules/layout.ts](https://github.com/storybookjs/storybook/blob/v10.5.5/code/core/src/manager-api/modules/layout.ts) ·
[theming/create.ts](https://github.com/storybookjs/storybook/blob/v10.5.5/code/core/src/theming/create.ts) ·
[StoryStore.ts](https://github.com/storybookjs/storybook/blob/v10.5.5/code/core/src/preview-api/modules/store/StoryStore.ts) ·
[prepareStory.ts](https://github.com/storybookjs/storybook/blob/v10.5.5/code/core/src/preview-api/modules/store/csf/prepareStory.ts)

Release notes —
[v10.0.0](https://github.com/storybookjs/storybook/releases/tag/v10.0.0) ·
[v10.2.0](https://github.com/storybookjs/storybook/releases/tag/v10.2.0) ·
[v10.5.0](https://github.com/storybookjs/storybook/releases/tag/v10.5.0)

No secondary sources (blog posts, community articles) were used in this file.
