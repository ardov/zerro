import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ScrollArea } from './ScrollArea'

const rows = (count: number) =>
  Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className="flex items-center justify-between border-b border-ui-border px-4 py-3"
    >
      <span>Row {i + 1}</span>
      <span className="text-ui-secondary">{(i + 1) * 120} ₽</span>
    </div>
  ))

const surface =
  'rounded-ui-card rounded-smooth bg-ui-card text-ui-primary shadow-ui-card'

const meta = {
  tags: ['autodocs'],
  title: 'UI Kit/Building blocks/ScrollArea',
  component: ScrollArea,
  parameters: {
    docs: {
      description: {
        component:
          'A vertically scrolling surface. Example: `<ScrollArea className="h-80 rounded-ui-card rounded-smooth bg-ui-card" contentClassName="py-2">{rows}</ScrollArea>`. `className` styles the surface itself — size, background, radius — and the content scrolls out of sight at its edge. Padding goes in `contentClassName`, inside the scroll; keep side padding on rows when the content has sticky headers. Percentages inside the content resolve only against a content that fills the area: to pin a footer to the bottom of short content, give the content `flex min-h-full flex-col` and the footer `mt-auto`. `scrollbar="overlay"` shows a thin thumb only while the area is hovered or scrolled; menus and popovers use `scrollbar="none"` with `fade`. The fade masks everything that scrolls, sticky headers included: with `fade`, put a header above the area rather than inside it. The viewport is never a tab stop, and the area never scrolls sideways. Sizing: give the surface a height to fill it, or a max-height to grow with the content up to it.',
      },
    },
    layout: 'fullscreen',
  },
  args: {
    className: `h-80 w-72 ${surface}`,
    scrollbar: 'overlay',
    fade: false,
    children: rows(30),
  },
  argTypes: {
    scrollbar: { control: 'inline-radio', options: ['overlay', 'none'] },
    children: { control: false },
  },
  decorators: [
    Story => (
      <main className="min-h-screen bg-ui-base p-6 font-sans text-ui-14 text-ui-primary">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof ScrollArea>
export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

function Case(props: { title: string; children: ReactNode }) {
  const { title, children } = props
  return (
    <section className="grid content-start gap-2">
      <h3 className="m-0 text-ui-14 font-medium text-ui-secondary">{title}</h3>
      {children}
    </section>
  )
}

/** Every arrangement at once, for comparison by eye. */
export const Showcase: Story = {
  render: () => (
    <div className="grid grid-cols-[repeat(auto-fill,18rem)] gap-6">
      <Case title="Fills a fixed height">
        <ScrollArea className={`h-80 ${surface}`}>{rows(30)}</ScrollArea>
      </Case>
      <Case title="Grows to its max-height: short">
        <ScrollArea className={`max-h-80 ${surface}`}>{rows(3)}</ScrollArea>
      </Case>
      <Case title="Grows to its max-height: long">
        <ScrollArea className={`max-h-80 ${surface}`}>{rows(30)}</ScrollArea>
      </Case>
      <Case title="No scrollbar, faded edges">
        <ScrollArea className={`h-80 ${surface}`} scrollbar="none" fade>
          {rows(30)}
        </ScrollArea>
      </Case>
      <Case title="Sticky header in the content">
        <ScrollArea className={`h-80 ${surface}`} contentClassName="pb-4">
          <div className="sticky top-0 z-1 border-b border-ui-border bg-ui-card px-4 py-3 font-medium">
            October
          </div>
          {rows(30)}
        </ScrollArea>
      </Case>
    </div>
  ),
}

/** The viewport is the root's first presentational descendant; the content
 * is inside it. */
const viewportOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[role="presentation"]')!

/** The viewport stays out of the tab order: Tab goes from the button before
 * the area straight to the first control inside it. */
export const NotATabStop: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="grid w-72 gap-2">
      <button>Before</button>
      <ScrollArea className={`h-40 ${surface}`} data-testid="area">
        {Array.from({ length: 20 }, (_, i) => (
          <button key={i} className="block w-full px-4 py-2 text-left">
            Item {i + 1}
          </button>
        ))}
      </ScrollArea>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(viewportOf(canvas.getByTestId('area')).tabIndex).toBe(-1)
    canvas.getByRole('button', { name: 'Before' }).focus()
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Item 1' })).toHaveFocus()
  },
}

/** A label too long for the row neither widens the content nor scrolls the
 * area sideways: the row's right edge stays in sight. */
export const NoSidewaysScroll: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <ScrollArea className={`h-40 w-72 ${surface}`} data-testid="area">
      <div className="flex justify-between gap-2 px-4 py-3">
        <span className="whitespace-nowrap">
          An_unbreakable_label_far_wider_than_the_area_itself
        </span>
        <span data-testid="amount">120 ₽</span>
      </div>
      {rows(20)}
    </ScrollArea>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const viewport = viewportOf(canvas.getByTestId('area'))
    const content = viewport.firstElementChild as HTMLElement
    await expect(content.offsetWidth).toBe(viewport.clientWidth)
    await expect(getComputedStyle(viewport).overflowX).toBe('hidden')
  },
}

/** A sticky header in the content holds the top edge of the surface. */
export const StickyHeader: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <ScrollArea className={`h-60 w-72 ${surface}`} data-testid="area">
      <div
        data-testid="header"
        className="sticky top-0 z-1 bg-ui-card px-4 py-3 font-medium"
      >
        October
      </div>
      {rows(30)}
    </ScrollArea>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const area = canvas.getByTestId('area')
    const viewport = viewportOf(area)
    viewport.scrollTop = 300
    await waitFor(() =>
      expect(
        Math.round(canvas.getByTestId('header').getBoundingClientRect().top)
      ).toBe(Math.round(area.getBoundingClientRect().top))
    )
  },
}

/** Grows with short content and stops at its max-height with long content. */
export const GrowsToMaxHeight: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex items-start gap-4">
      <ScrollArea className={`max-h-60 w-60 ${surface}`} data-testid="short">
        {rows(2)}
      </ScrollArea>
      <ScrollArea className={`max-h-60 w-60 ${surface}`} data-testid="long">
        {rows(30)}
      </ScrollArea>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const short = canvas.getByTestId('short').getBoundingClientRect().height
    const long = canvas.getByTestId('long').getBoundingClientRect().height
    await expect(short).toBeLessThan(240)
    await expect(Math.round(long)).toBe(240)
  },
}

/** The fade appears only at an edge with more past it. */
export const FadeFollowsOverflow: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <ScrollArea
      className={`h-60 w-72 ${surface}`}
      scrollbar="none"
      fade
      data-testid="area"
    >
      {rows(30)}
    </ScrollArea>
  ),
  play: async ({ canvasElement }) => {
    const area = within(canvasElement).getByTestId('area')
    const viewport = viewportOf(area)
    await waitFor(() => expect(area).toHaveAttribute('data-overflow-y-end'))
    await expect(area).not.toHaveAttribute('data-overflow-y-start')
    await expect(area.querySelector('.kit-scrollbar')).toBe(null)
    viewport.scrollTop = 100
    await waitFor(() => expect(area).toHaveAttribute('data-overflow-y-start'))
  },
}
