import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Total } from './Total'

const meta = {
  title: 'UI/Total',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta
type Story = StoryObj

// The amount colours are deliberate: MUI's `color` prop silently dropped the
// palette paths this component was written with, so before the migration every
// amount rendered in the foreground colour. These states are the intent the
// props always described, turned on knowingly.
function AmountStates() {
  return (
    <div className="flex gap-8">
      <span data-testid="ref-muted" className="text-muted-foreground" />
      <span data-testid="ref-foreground" className="text-foreground" />
      <span data-testid="ref-error" className="text-error" />
      <span data-testid="ref-success" className="text-success" />

      <Total data-testid="zero" title="Zero" value={0} currency="RUB" />
      <Total data-testid="plain" title="Plain" value={1200} currency="RUB" />
      <Total
        data-testid="negative"
        title="Overspent"
        value={-1200}
        currency="RUB"
        amountColor="error"
      />
      <Total
        data-testid="positive"
        title="Available"
        value={1200}
        currency="RUB"
        amountColor="success"
      />
    </div>
  )
}

const checkAmountColors: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const amountOf = (testId: string) =>
    getComputedStyle(canvas.getByTestId(testId).querySelectorAll('p')[1]).color
  const referenceOf = (testId: string) =>
    getComputedStyle(canvas.getByTestId(testId)).color

  await expect(amountOf('zero')).toBe(referenceOf('ref-muted'))
  await expect(amountOf('plain')).toBe(referenceOf('ref-foreground'))
  await expect(amountOf('negative')).toBe(referenceOf('ref-error'))
  await expect(amountOf('positive')).toBe(referenceOf('ref-success'))

  // The title stays muted whatever the amount does.
  const titleOf = (testId: string) =>
    getComputedStyle(canvas.getByTestId(testId).querySelectorAll('p')[0]).color
  await expect(titleOf('negative')).toBe(referenceOf('ref-muted'))
}

export const AmountColorsLight: Story = {
  render: AmountStates,
  play: checkAmountColors,
}

export const AmountColorsDark: Story = {
  globals: { theme: 'dark' },
  render: AmountStates,
  play: checkAmountColors,
}
