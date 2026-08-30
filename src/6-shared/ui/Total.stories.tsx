import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Total } from './Total'

const meta = {
  title: 'Library/Display/Total',
  component: Total,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { currency: 'RUB', title: 'Available', value: 1200 },
} satisfies Meta<typeof Total>

export default meta
type Story = StoryObj<typeof meta>

// The amount colors are deliberate and reflect the semantic states described
// by the component props.
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

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

export const Showcase: Story = {
  tags: ['!test'],
  render: AmountStates,
}

export const AmountColors: Story = {
  tags: ['!dev', '!autodocs'],
  render: AmountStates,
  play: checkAmountColors,
}
