import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Rail } from './Rail'
import { MobileNavigation } from './MobileNavigation'

const meta = {
  title: 'App/Navigation',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    app: { scenario: 'demo', globalWidgets: true },
  },
} satisfies Meta

export default meta
type Story = StoryObj

export const DesktopRail: Story = {
  render: () => (
    <div className="flex h-[720px] bg-ui-base">
      <Rail />
      <div className="grow" />
    </div>
  ),
}

export const MobileBottomNavigation: Story = {
  globals: { viewport: { value: 'iphone13' } },
  parameters: { app: { route: '/transactions' } },
  render: () => (
    <div className="flex min-h-[600px] flex-col bg-ui-base">
      <span hidden data-testid="primary" className="text-ui-primary" />
      <span hidden data-testid="secondary" className="text-ui-secondary" />
      <MobileNavigation onHeightChange={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation')
    const primary = getComputedStyle(canvas.getByTestId('primary')).color
    const secondary = getComputedStyle(canvas.getByTestId('secondary')).color
    const checkColors = () => {
      expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
      for (const action of nav.querySelectorAll('a, button')) {
        const icon = action.querySelector('svg')
        if (icon)
          expect(getComputedStyle(icon).color).toBe(
            action.getAttribute('aria-current') === 'page' ? primary : secondary
          )
      }
    }
    await waitFor(checkColors)
    const next = within(nav)
      .getAllByRole('link')
      .find(link => !link.hasAttribute('aria-current'))!
    await userEvent.click(next)
    await userEvent.unhover(next)
    await waitFor(() => {
      expect(next).toHaveAttribute('aria-current', 'page')
      checkColors()
    })
  },
}
