import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { AvailableCell } from './AvailableCell'

const meta = {
  title: 'App/Budgets/AvailableCell',
  component: AvailableCell,
  args: {
    id: 'parent',
    available: 1200,
    assigned: 1500,
    hiddenOverspend: -100,
  },
  render: args => (
    // Budget metrics occupy 90px in both the desktop and mobile table.
    <div className="grid w-[90px] gap-4">
      <div data-testid="warning-cell">
        <AvailableCell {...args} />
      </div>
      <div data-testid="regular-cell">
        <AvailableCell {...args} id="regular" hiddenOverspend={0} />
      </div>
    </div>
  ),
} satisfies Meta<typeof AvailableCell>
export default meta
type Story = StoryObj<typeof meta>

export const ParentOverspend: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const warning = canvas.getByTestId('warning-cell')
    const regular = canvas.getByTestId('regular-cell')
    const icon = warning.querySelector('svg')!
    const amount = within(warning).getByRole('button')
    expect(icon).toBeVisible()
    expect(getComputedStyle(icon).stroke).not.toBe('none')
    expect(warning.getBoundingClientRect().height).toBe(
      regular.getBoundingClientRect().height
    )
    const iconBounds = icon.getBoundingClientRect()
    const amountBounds = amount.getBoundingClientRect()
    expect(
      Math.abs(
        iconBounds.y +
          iconBounds.height / 2 -
          (amountBounds.y + amountBounds.height / 2)
      )
    ).toBeLessThanOrEqual(1)
    expect(iconBounds.right).toBeLessThanOrEqual(amountBounds.left)
    expect(amountBounds.right).toBe(
      within(regular).getByRole('button').getBoundingClientRect().right
    )
    if ('__vitest_browser_runner__' in window) {
      const { page } = await import('vitest/browser')
      await page.elementLocator(icon).hover()
    } else {
      await userEvent.hover(icon)
    }
    const tooltip = await within(canvasElement.ownerDocument.body).findByText(
      /Overspending in the parent category/
    )
    await waitFor(() => expect(tooltip).toBeVisible())
    expect(tooltip).toHaveTextContent('100')
  },
}

export const ParentOverspendMobile: Story = {
  ...ParentOverspend,
  globals: { viewport: { value: 'iphone13' } },
}
