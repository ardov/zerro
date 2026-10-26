import { useState } from 'react'
import type { TISODate } from '@/6-shared/types'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { formatDate } from '@/6-shared/helpers/date'
import { GroupedList } from './GroupedList'

function Demo() {
  const [date, setDate] = useState<TISODate>()
  return (
    <>
      <div style={{ width: 400, maxWidth: '100%', height: 180 }}>
        <GroupedList
          groups={[
            { date: '2026-09-20', ids: ['new'] },
            { date: '2026-09-10', ids: ['old', 'older', 'oldest'] },
          ]}
          onTopDateChange={setDate}
          renderTransaction={id => (
            <div key={id} style={{ height: 72 }}>
              {id}
            </div>
          )}
        />
      </div>
      <output aria-label="Top date">{date}</output>
    </>
  )
}
const meta = {
  title: 'App/Transactions/DateNavigation',
  render: () => <Demo />,
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>
const check: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  await userEvent.click(
    await canvas.findByRole('button', { name: formatDate('2026-09-20') })
  )
  const dialog = await body.findByRole('dialog', { name: 'Select date' })
  const days = within(dialog)
  const older = days.getByRole('button', {
    name: formatDate('2026-09-10', 'PPPP'),
  })
  await expect(
    days.getByRole('button', { name: formatDate('2026-09-09', 'PPPP') })
  ).toBeDisabled()
  await expect(
    days.getByRole('button', { name: formatDate('2026-09-21', 'PPPP') })
  ).toBeDisabled()
  await userEvent.click(older)
  await waitFor(() =>
    expect(body.queryByRole('dialog', { name: 'Select date' })).toBeNull()
  )
  await waitFor(() =>
    expect(canvas.getByLabelText('Top date')).toHaveTextContent('2026-09-10')
  )
}
export const Desktop: Story = {
  globals: { viewport: { value: 'zerro500' } },
  play: check,
}
export const Mobile: Story = {
  globals: { viewport: { value: 'zerro499' } },
  play: check,
}

export const WideListAlignment: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div style={{ width: 850, height: 300 }}>
      <GroupedList
        groups={[{ date: '2026-09-20', ids: ['row'] }]}
        renderTransaction={id => (
          <div key={id} data-testid="wide-row" style={{ height: 72 }}>
            {id}
          </div>
        )}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const row = await within(canvasElement).findByTestId('wide-row')
    const scroller = canvasElement.querySelector('[role="list"]')!
    const rowRect = row.getBoundingClientRect()
    const listRect = scroller.getBoundingClientRect()
    await expect(
      Math.abs(rowRect.x + rowRect.width / 2 - listRect.x - listRect.width / 2)
    ).toBeLessThan(1)
  },
}

const longGroups = [
  {
    date: '2026-09-20' as const,
    ids: Array.from({ length: 1000 }, (_, i) => `new-${i}`),
  },
  {
    date: '2026-09-10' as const,
    ids: Array.from({ length: 30 }, (_, i) => `old-${i}`),
  },
]

function LongList({
  restore = false,
  differentWidths = false,
}: {
  restore?: boolean
  differentWidths?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [date, setDate] = useState<TISODate>()
  return (
    <>
      <div
        style={
          {
            height: 400,
            width: 700,
            maxWidth: '100%',
          } as React.CSSProperties
        }
      >
        <GroupedList
          groups={
            differentWidths
              ? [longGroups[0], { ...longGroups[1], date: '2026-09-09' }]
              : longGroups
          }
          restoredTopDate={restore ? '2026-09-10' : null}
          onTopDateChange={setDate}
          header={
            <div style={{ height: expanded ? 96 : 48 }}>
              <button onClick={() => setExpanded(!expanded)}>
                Expand filters
              </button>
            </div>
          }
          renderTransaction={id => (
            <button
              style={{ height: 72, width: '100%' }}
              onClick={() => setDate('2026-01-01')}
            >
              {id}
            </button>
          )}
        />
      </div>
      <output aria-label="Current date">{date}</output>
    </>
  )
}

export const VirtualRowsAndSurface: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LongList />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const viewport = canvasElement.querySelector<HTMLElement>(
      '.kit-scroll-viewport'
    )!
    const surface = canvasElement.querySelector<HTMLElement>(
      '.transaction-date-surface'
    )!
    const chip = canvasElement.querySelector<HTMLElement>(
      '.transaction-date-chip'
    )!
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-row-key="transaction:new-0"]')
      ).not.toBeNull()
    )
    await expect(
      canvasElement.querySelectorAll('[data-row-key]').length
    ).toBeLessThan(30)
    await expect(surface.getBoundingClientRect().height).toBe(48)
    await expect(getComputedStyle(surface).backdropFilter).toBe('none')
    await expect(getComputedStyle(surface).backgroundImage).toBe('none')
    await expect(
      getComputedStyle(
        canvasElement.querySelector('.transaction-filter-surface')!
      ).backdropFilter
    ).toBe('blur(2px) saturate(1.2)')
    await expect(chip).not.toBeVisible()
    viewport.scrollTop = 150
    await waitFor(() => expect(chip).toHaveAttribute('data-pinned'))
    const firstTop =
      canvasElement
        .querySelector('[data-row-key="transaction:new-2"]')!
        .getBoundingClientRect().top - surface.getBoundingClientRect().top
    await userEvent.click(
      canvas.getByRole('button', { name: 'Expand filters' })
    )
    await waitFor(() => expect(surface.style.top).toBe('96px'))
    await expect(
      Math.abs(
        canvasElement
          .querySelector('[data-row-key="transaction:new-2"]')!
          .getBoundingClientRect().top -
          surface.getBoundingClientRect().top -
          firstTop
      )
    ).toBeLessThan(1)
    viewport.scrollTop = 48 + 1000 * 72 + 1
    await waitFor(() =>
      expect(chip).toHaveTextContent(formatDate('2026-09-10'))
    )
    await expect(canvas.getByLabelText('Current date')).toHaveTextContent(
      '2026-09-10'
    )
    viewport.scrollTop = 150
    await waitFor(() =>
      expect(chip).toHaveAccessibleName(formatDate('2026-09-20'))
    )
    await expect(
      canvasElement.querySelectorAll('[data-row-key]').length
    ).toBeLessThan(30)
    viewport.scrollTop = 0
    await waitFor(() => expect(chip).not.toBeVisible())
  },
}

export const RestoresDate: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LongList restore />,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText('Current date')
      ).toHaveTextContent('2026-09-10')
    )
    const viewport = canvasElement.querySelector<HTMLElement>(
      '.kit-scroll-viewport'
    )!
    await expect(Math.round(viewport.scrollTop)).toBe(72048)
    await expect(
      canvasElement.querySelectorAll('[data-row-key]').length
    ).toBeLessThan(30)
  },
}

export const PinnedDateAlignment: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LongList />,
  play: async ({ canvasElement }) => {
    const date = await within(canvasElement).findByRole('button', {
      name: formatDate('2026-09-20'),
    })
    const textBounds = (element: Element) => {
      const range = document.createRange()
      range.selectNodeContents(element)
      return range.getBoundingClientRect()
    }
    await document.fonts.ready
    const before = textBounds(date)
    const viewport = canvasElement.querySelector<HTMLElement>(
      '.kit-scroll-viewport'
    )!
    viewport.scrollTop = 1
    const chip = canvasElement.querySelector<HTMLElement>(
      '.transaction-date-chip'
    )!
    await waitFor(() => expect(chip).toHaveAttribute('data-pinned'))
    const label = chip.querySelector('.transaction-date-current')!
    const after = textBounds(label)
    await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth)
    await expect(after.right).toBeLessThanOrEqual(
      chip.getBoundingClientRect().right
    )
    await expect(Math.abs(after.left - before.left)).toBeLessThan(1)
    await expect(Math.abs(after.top - before.top)).toBeLessThan(1)
    await expect(getComputedStyle(label).fontSize).toBe(
      getComputedStyle(date).fontSize
    )
    await expect(getComputedStyle(label).fontWeight).toBe(
      getComputedStyle(date).fontWeight
    )
    await expect(getComputedStyle(label).fontVariantNumeric).toBe(
      'tabular-nums'
    )
    await expect(getComputedStyle(date).fontVariantNumeric).toBe('tabular-nums')
  },
}

export const DateSwitchThreshold: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LongList />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const viewport = canvasElement.querySelector<HTMLElement>(
      '.kit-scroll-viewport'
    )!
    const chip = canvasElement.querySelector('.transaction-date-chip')!
    await canvas.findByRole('button', { name: formatDate('2026-09-20') })
    // The second day's header starts at 72048, excluding the filter padding.
    viewport.scrollTop = 72039
    await waitFor(() =>
      expect(chip).toHaveAccessibleName(formatDate('2026-09-20'))
    )
    viewport.scrollTop = 72040
    await waitFor(() =>
      expect(chip).toHaveAccessibleName(formatDate('2026-09-10'))
    )
    const sourceDate = canvasElement.querySelector(
      '[data-row-key="date:2026-09-10"] button'
    )!
    await expect(sourceDate).not.toBeVisible()
    const animated = chip.querySelector('.transaction-date-label')!
    await expect(animated).toHaveAttribute('data-direction', 'forward')
    await expect(
      getComputedStyle(animated)
        .getPropertyValue('--date-label-distance')
        .trim()
    ).toBe(
      matchMedia('(prefers-reduced-motion: reduce)').matches ? '0px' : '4px'
    )
    await expect(animated.children.length).toBe(2)
    viewport.scrollTop = 72039
    await waitFor(() =>
      expect(chip).toHaveAccessibleName(formatDate('2026-09-20'))
    )
    await expect(sourceDate).toBeVisible()
    const reversed = chip.querySelector('.transaction-date-label')!
    await expect(reversed).toHaveAttribute('data-direction', 'backward')
    await expect(
      getComputedStyle(reversed)
        .getPropertyValue('--date-label-distance')
        .trim()
    ).toBe(
      matchMedia('(prefers-reduced-motion: reduce)').matches ? '0px' : '-4px'
    )
    await expect(reversed.children.length).toBe(2)
  },
}

function EmptyResultsExample({
  initiallyEmpty = false,
}: {
  initiallyEmpty?: boolean
}) {
  const [empty, setEmpty] = useState(initiallyEmpty)
  const [saved, setSaved] = useState<TISODate | null>(null)
  const [initial, setInitial] = useState<TISODate>('2026-09-20')
  return (
    <>
      <button onClick={() => setEmpty(!empty)}>Toggle empty results</button>
      <button onClick={() => setInitial('2026-09-10')}>
        Change initial date
      </button>
      <div style={{ width: 400, height: 300 }}>
        <GroupedList
          groups={empty ? [] : longGroups}
          restoredTopDate={saved}
          initialDate={initiallyEmpty ? initial : undefined}
          onTopDateChange={setSaved}
          renderTransaction={id => <div style={{ height: 72 }}>{id}</div>}
        />
      </div>
      <output aria-label="Saved date">{saved}</output>
    </>
  )
}

export const RestoresAfterEmptyResults: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <EmptyResultsExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const viewport = canvasElement.querySelector<HTMLElement>(
      '.kit-scroll-viewport'
    )!
    await canvas.findByText('new-0')
    viewport.scrollTop = 72048
    await waitFor(() =>
      expect(canvas.getByLabelText('Saved date')).toHaveTextContent(
        '2026-09-10'
      )
    )
    await userEvent.click(
      canvas.getByRole('button', { name: 'Toggle empty results' })
    )
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('[data-row-key]').length).toBe(0)
    )
    await waitFor(() => expect(viewport.scrollTop).toBe(0))
    await userEvent.click(
      canvas.getByRole('button', { name: 'Toggle empty results' })
    )
    await waitFor(() => expect(viewport.scrollTop).toBe(72048))
    await expect(canvas.getByLabelText('Saved date')).toHaveTextContent(
      '2026-09-10'
    )
  },
}

export const LatestInitialDateAfterEmptyResults: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <EmptyResultsExample initiallyEmpty />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change initial date' })
    )
    await userEvent.click(
      canvas.getByRole('button', { name: 'Toggle empty results' })
    )
    const viewport = canvasElement.querySelector<HTMLElement>(
      '.kit-scroll-viewport'
    )!
    await waitFor(() => expect(viewport.scrollTop).toBe(72048))
    await expect(canvas.getByLabelText('Saved date')).toHaveTextContent(
      '2026-09-10'
    )
  },
}

export const DateLabelHorizontalStability: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LongList differentWidths />,
  play: async ({ canvasElement }) => {
    await document.fonts.ready
    const viewport = canvasElement.querySelector<HTMLElement>(
      '.kit-scroll-viewport'
    )!
    const chip = canvasElement.querySelector('.transaction-date-chip')!
    const textLeft = (selector: string) => {
      const range = document.createRange()
      range.selectNodeContents(chip.querySelector(selector)!)
      return range.getBoundingClientRect().left
    }
    viewport.scrollTop = 72039
    await waitFor(() =>
      expect(chip).toHaveAccessibleName(formatDate('2026-09-20'))
    )
    const originalLeft = textLeft('.transaction-date-current')
    for (const [offset, date] of [
      [72040, '2026-09-09'],
      [72039, '2026-09-20'],
    ] as const) {
      viewport.scrollTop = offset
      await waitFor(() => expect(chip).toHaveAccessibleName(formatDate(date)))
      await expect(
        Math.abs(textLeft('.transaction-date-outgoing') - originalLeft)
      ).toBeLessThan(0.1)
      await expect(
        Math.abs(textLeft('.transaction-date-current') - originalLeft)
      ).toBeLessThan(0.1)
    }
  },
}

function GeometryExample({
  height = 300,
  filterHeight = 48,
  scaled = false,
  restore = false,
}: {
  height?: number
  filterHeight?: number
  scaled?: boolean
  restore?: boolean
}) {
  const [initialDate, setInitialDate] = useState<TISODate>('2026-09-20')
  const [date, setDate] = useState<TISODate>()
  return (
    <>
      <button onClick={() => setInitialDate('2026-09-10')}>
        Jump to older date
      </button>
      <div
        style={
          {
            height,
            width: 400,
            scale: scaled ? '.99' : undefined,
          } as React.CSSProperties
        }
      >
        <GroupedList
          groups={longGroups}
          initialDate={restore ? '2026-09-10' : initialDate}
          onTopDateChange={setDate}
          header={
            <div style={{ height: filterHeight, overflow: 'hidden' }}>
              <button>Filter control</button>
            </div>
          }
          renderTransaction={id => <button style={{ height: 72 }}>{id}</button>}
        />
      </div>
      <output aria-label="Geometry date">{date}</output>
    </>
  )
}
export const ChangesInitialDate: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <GeometryExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText('new-0')
    await userEvent.click(
      canvas.getByRole('button', { name: 'Jump to older date' })
    )
    await waitFor(() =>
      expect(canvas.getByLabelText('Geometry date')).toHaveTextContent(
        '2026-09-10'
      )
    )
    await expect(
      canvasElement.querySelector('.kit-scroll-viewport')!.scrollTop
    ).toBe(72048)
  },
}
export const ZeroHeightFilters: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <GeometryExample filterHeight={0} restore />,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        canvasElement.querySelector('.kit-scroll-viewport')!.scrollTop
      ).toBe(72048)
    )
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText('Geometry date')
      ).toHaveTextContent('2026-09-10')
    )
  },
}
export const ShortViewportLastDate: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <GeometryExample height={80} />,
  play: async ({ canvasElement }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '.kit-scroll-viewport'
    )!
    await within(canvasElement).findByText('new-0')
    viewport.scrollTop = viewport.scrollHeight
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText('Geometry date')
      ).toHaveTextContent('2026-09-10')
    )
  },
}
export const ScaledFilterMeasurement: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <GeometryExample scaled />,
  play: async ({ canvasElement }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '.kit-scroll-viewport'
    )!
    await waitFor(() =>
      expect(getComputedStyle(viewport).scrollPaddingTop).toBe('48px')
    )
    await expect(
      canvasElement.querySelector<HTMLElement>('.transaction-date-surface')!
        .style.top
    ).toBe('48px')
  },
}
export const KeyboardAndTrack: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <GeometryExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const filter = await canvas.findByRole('button', { name: 'Filter control' })
    const source = await canvas.findByRole('button', {
      name: formatDate('2026-09-20'),
    })
    const viewport = canvasElement.querySelector<HTMLElement>(
      '.kit-scroll-viewport'
    )!
    filter.focus()
    await userEvent.tab()
    await expect(source).toHaveFocus()
    viewport.scrollTop = 1
    const chip = canvasElement.querySelector('.transaction-date-chip')!
    await waitFor(() => expect(chip).toHaveFocus())
    await expect(getComputedStyle(chip).opacity).toBe('1')
    viewport.scrollTop = 0
    await waitFor(() => expect(source).toHaveFocus())
    const track = canvasElement.querySelector('.kit-scrollbar')!
    const filterRect = canvasElement
      .querySelector('.transaction-filter-surface')!
      .getBoundingClientRect()
    const trackRect = track.getBoundingClientRect()
    await expect(trackRect.top).toBeGreaterThanOrEqual(filterRect.bottom)
    await expect(
      track.contains(
        document.elementFromPoint(trackRect.right - 2, trackRect.top + 2)
      )
    ).toBe(true)
    viewport.scrollTop = 150
    await waitFor(() => expect(chip).toHaveAttribute('data-pinned'))
    const row = canvas.getByRole('button', { name: 'new-0' })
    row.focus()
    await expect(row.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      filterRect.bottom
    )
  },
}
