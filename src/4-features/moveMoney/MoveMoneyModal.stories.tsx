import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { core } from '@/zerro-core/redux'
import { MonthProvider, useMonth } from '@/2-pages/Budgets/MonthProvider'
import { useAppDispatch, useAppSelector } from '@/store'
import { MoveMoneyModal } from './MoveMoneyModal'

const meta = {
  title: 'App/MoveMoney/MoveMoneyModal',
  component: MoveMoneyModal,
  tags: ['autodocs'],
  parameters: {
    app: { scenario: 'demo' },
    layout: 'centered',
  },
} satisfies Meta<typeof MoveMoneyModal>

export default meta
type Story = StoryObj

function AmountHarness({ longNames = false }: { longNames?: boolean }) {
  const dispatch = useAppDispatch()
  const envelopes = useAppSelector(core.envelopes.selectAll)
  const [id] = useState(
    () =>
      Object.values(envelopes).find(envelope => envelope.name === 'Food')!.id
  )
  const [otherId] = useState(
    () =>
      Object.values(envelopes).find(
        envelope =>
          envelope.id.startsWith('tag#') &&
          envelope.id !== 'tag#null' &&
          envelope.id !== id
      )!.id
  )
  const [month] = useMonth()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const metrics = useAppSelector(core.activity.selectEnvelopeMetrics)[month][id]
  const [, setCurrency] = core.currency.useDisplayCurrency()
  const convert = useAppSelector(core.currency.selectConvertFx)
  const assigned = convert(metrics.totalAssigned, envelopes[id].currency, month)
  const commands = useAppSelector(state => state.data.outbox.length)
  return (
    <>
      <button
        type="button"
        onClick={event => {
          // This is an input/commit regression, not an FX round-trip test.
          // Edit in the envelope currency so cent rounding cannot change 30.
          setCurrency(envelopes[id].currency)
          if (longNames) {
            dispatch(
              core.envelopes.rename(
                id,
                'Very long destination category for everyday expenses'
              )
            )
            dispatch(
              core.envelopes.rename(
                otherId,
                'Very long source category for savings'
              )
            )
          }
          setAnchor(event.currentTarget)
        }}
      >
        Open amount editor
      </button>
      <output data-testid="commands">{commands}</output>
      <output data-testid="assigned">{assigned}</output>
      <MoveMoneyModal
        key={String(!!anchor)}
        month={month}
        source={longNames ? otherId : 'toBeAssigned'}
        destination={id}
        open={!!anchor}
        onClose={() => setAnchor(null)}
      />
    </>
  )
}

export const MoveMoneyAmountRegression: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <MonthProvider>
      <AmountHarness />
    </MonthProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const commands = Number(canvas.getByTestId('commands').textContent)
    const assigned = Number(canvas.getByTestId('assigned').textContent)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open amount editor' })
    )
    let input = await body.findByPlaceholderText('0')
    await userEvent.clear(input)
    await userEvent.type(input, '99{Escape}')
    await waitFor(() => expect(input).not.toBeVisible())
    await expect(Number(canvas.getByTestId('commands').textContent)).toBe(
      commands
    )
    await expect(Number(canvas.getByTestId('assigned').textContent)).toBe(
      assigned
    )
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open amount editor' })
    )
    input = await body.findByPlaceholderText('0')
    await userEvent.click(input)
    await userEvent.clear(input)
    await userEvent.type(input, '25,5+4.5{Enter}')
    await waitFor(() => expect(input).not.toBeVisible())
    await expect(Number(canvas.getByTestId('commands').textContent)).toBe(
      commands + 1
    )
    await expect(
      Number(canvas.getByTestId('assigned').textContent)
    ).toBeCloseTo(assigned + 30)
  },
}

export const MobileMoveMoneyAmountRegression: Story = {
  ...MoveMoneyAmountRegression,
  globals: { viewport: { value: 'iphone13' } },
}

export const LongCategoryNames: Story = {
  render: () => (
    <MonthProvider>
      <AmountHarness longNames />
    </MonthProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open amount editor' })
    )
    const dialog = await body.findByRole('dialog')
    const chips = Array.from(
      dialog.querySelectorAll<HTMLElement>('[data-slot="chip"]')
    )
    expect(chips).toHaveLength(2)
    await waitFor(() => {
      const [source, destination] = chips.map(chip =>
        chip.getBoundingClientRect()
      )
      expect(source.top).toBe(destination.top)
      expect(source.width).toBeGreaterThanOrEqual(40)
      expect(destination.width).toBeGreaterThanOrEqual(40)
      expect(destination.right).toBeLessThanOrEqual(
        dialog.getBoundingClientRect().right
      )
      for (const chip of chips)
        expect(chip.querySelector('[data-overflow]')).not.toBeNull()
    })
  },
}
export const MobileLongCategoryNames: Story = {
  ...LongCategoryNames,
  globals: { viewport: { value: 'iphone13' } },
}
