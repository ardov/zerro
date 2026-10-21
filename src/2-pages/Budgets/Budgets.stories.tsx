import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import Budgets from './index'
import { panelWidths } from '@/6-shared/ui/layout/panelWidths'

const meta = {
  title: 'App/Budgets/Page',
  component: Budgets,
  parameters: {
    layout: 'fullscreen',
    app: { scenario: 'demo', route: '/budget' },
    viewport: {
      options: {
        belowAccounts: {
          name: 'Before accounts panel (1559px)',
          styles: { width: '1559px', height: '900px' },
          type: 'desktop',
        },
        withAccounts: {
          name: 'With accounts panel (1560px)',
          styles: { width: '1560px', height: '900px' },
          type: 'desktop',
        },
      },
    },
  },
  render: () => (
    <div className="flex h-dvh bg-ui-base">
      <div style={{ width: panelWidths.rail }} className="shrink-0" />
      <div
        data-testid="budget-panels"
        className="flex min-w-0 flex-1"
        style={{
          gap: panelWidths.gap,
          padding: `${panelWidths.gap}px ${panelWidths.gap}px ${panelWidths.gap}px 0`,
        }}
      >
        <Budgets />
      </div>
    </div>
  ),
} satisfies Meta<typeof Budgets>
export default meta
type Story = StoryObj<typeof meta>

export const BeforeAccountsPanel: Story = {
  globals: { viewport: { value: 'belowAccounts' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(window.innerWidth).toBe(1559)
    expect(canvas.queryByRole('button', { name: /Cash USD/ })).toBeNull()
    const panels = canvas.getByTestId('budget-panels')
    // DnD also renders visually hidden announcement nodes beside the panels.
    const columns = Array.from(panels.children).filter(
      child =>
        child.getBoundingClientRect().width > 1 &&
        child.getBoundingClientRect().height > 1
    )
    expect(columns).toHaveLength(2)
    expect(panels.scrollWidth).toBeLessThanOrEqual(panels.clientWidth)
    expect(columns[columns.length - 1].getBoundingClientRect().width).toBe(360)
  },
}

export const WithAccountsPanel: Story = {
  globals: { viewport: { value: 'withAccounts' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(window.innerWidth).toBe(1560)
    const account = canvas.getByRole('button', { name: /Cash USD/ })
    expect(account.getBoundingClientRect().height).toBe(40)
    const panels = canvas.getByTestId('budget-panels')
    // DnD also renders visually hidden announcement nodes beside the panels.
    const columns = Array.from(panels.children).filter(
      child =>
        child.getBoundingClientRect().width > 1 &&
        child.getBoundingClientRect().height > 1
    )
    expect(columns).toHaveLength(3)
    expect(columns[0].getBoundingClientRect().width).toBe(280)
    expect(columns[1].getBoundingClientRect().width).toBe(848)
    expect(columns[2].getBoundingClientRect().width).toBe(360)
    expect(panels.scrollWidth).toBeLessThanOrEqual(panels.clientWidth)
  },
}
