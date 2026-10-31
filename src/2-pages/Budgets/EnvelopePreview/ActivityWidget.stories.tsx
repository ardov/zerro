import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Provider } from 'react-redux'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { makeStoryStore } from 'stories/fixtures/storyStore'
import { core } from '@/zerro-core/redux'
import { MonthProvider, useMonth } from '../MonthProvider'
import { ActivityWidget } from './ActivityWidget'

function MonthlyBalance() {
  const [store] = useState(() => {
    const store = makeStoryStore('demo')
    store.dispatch(
      core.budgets.setTotalAssigned({
        month: '2026-03',
        id: 'tag#Transportation',
        amount: 20,
      })
    )
    return store
  })
  return (
    <Provider store={store}>
      <MonthProvider>
        <Chart />
      </MonthProvider>
    </Provider>
  )
}

function Chart() {
  const [month, setMonth] = useMonth()
  return (
    <div className="w-[312px]">
      <button onClick={() => setMonth('2026-03')}>March 2026</button>
      <output aria-label="Selected month">{month}</output>
      <ActivityWidget id="tag#Transportation" />
    </div>
  )
}

const meta = {
  title: 'App/Budgets/Envelope/MonthlyBalance',
  component: MonthlyBalance,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MonthlyBalance>

export default meta
type Story = StoryObj<typeof meta>

export const Overspending: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByText('March 2026'))
    await waitFor(() => {
      const bars = canvasElement.querySelectorAll('.recharts-bar')
      const budgets = bars[0].querySelectorAll('rect')
      const spending = bars[1].querySelectorAll('rect')
      const lines = bars[2].querySelectorAll('rect')
      expect(lines.length).toBeGreaterThan(0)
      // Include an overspent month with a positive budget, so the line must
      // meet the budget's top inside the spending column, not just at zero.
      expect(budgets.length).toBeGreaterThan(0)
      const x = (rect: Element) => Number(rect.getAttribute('x'))
      for (const line of lines) {
        const column = Array.from(spending).find(
          rect => Math.abs(x(rect) - x(line)) < 0.01
        )
        expect(column).toBeDefined()
        expect(line.getAttribute('width')).toBe(column!.getAttribute('width'))
      }
      const budget = budgets[0]
      const line = Array.from(lines).find(
        rect => Math.abs(x(rect) - x(budget)) < 0.01
      )!
      expect(line).toBeDefined()
      expect(line.getAttribute('y')).toBe(budget.getAttribute('y'))
    })
  },
}

export const PointerFocus: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByText('March 2026'))
    const surface =
      canvasElement.querySelector<SVGSVGElement>('.recharts-surface')!
    const { page } = await import('vitest/browser')
    await page.elementLocator(surface).click()
    expect(surface).toHaveFocus()
    expect(getComputedStyle(surface).outlineStyle).toBe('none')
    await userEvent.tab({ shift: true })
    await userEvent.tab()
    expect(surface).toHaveFocus()
    expect(getComputedStyle(surface).outlineStyle).not.toBe('none')
  },
}
