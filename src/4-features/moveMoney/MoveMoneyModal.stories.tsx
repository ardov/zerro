import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { core } from '@/zerro-core/redux'
import { MonthProvider, useMonth } from '@/2-pages/Budgets/MonthProvider'
import { useAppSelector } from '@/store'
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

function AmountHarness() {
  const [month] = useMonth()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const id = Object.values(useAppSelector(core.envelopes.selectAll)).find(
    envelope => envelope.name === 'Food'
  )!.id
  const metrics = useAppSelector(core.activity.selectEnvelopeMetrics)[month][id]
  const [currency] = core.currency.useDisplayCurrency()
  const convert = useAppSelector(core.currency.selectConvertFx)
  const assigned = convert(metrics.totalAssigned, currency, month)
  const commands = useAppSelector(state => state.data.outbox.length)
  return (
    <>
      <button type="button" onClick={event => setAnchor(event.currentTarget)}>
        Open amount editor
      </button>
      <output data-testid="commands">{commands}</output>
      <output data-testid="assigned">{assigned}</output>
      <MoveMoneyModal
        key={String(!!anchor)}
        month={month}
        source="toBeAssigned"
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
