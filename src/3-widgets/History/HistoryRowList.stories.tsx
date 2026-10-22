import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useAppSelector } from '@/store'
import type { THistoryPointRef, THistoryRow } from '@/store/history'
import { HistoryRowList } from './HistoryRowList'

const meta = {
  title: 'App/History/Rows',
  component: HistoryRowList,
  parameters: { app: { scenario: 'demo' }, layout: 'centered' },
} satisfies Meta<typeof HistoryRowList>
export default meta
type Story = StoryObj

const command = {
  issuedAt: 1773500000000,
  operations: [],
  label: {
    verb: 'transaction-edited' as const,
    args: {
      name: 'A very long transaction description that must fade without moving the current-state badge',
    },
  },
}
const entries = [2, 1].map(sequence => ({
  sequence,
  kind: 'sync' as const,
  serverTimestamp: 1773400000 + sequence,
  pushed: false,
}))

function Harness() {
  const expanded = useAppSelector(state =>
    state.history.expandedRuns.includes('rows-demo')
  )
  const [selected, setSelected] = useState<THistoryPointRef | null>({
    kind: 'local',
    index: 0,
  })
  const rows: THistoryRow[] = [
    { type: 'section', id: 'local' },
    { type: 'redo', command: { ...command, issuedAt: command.issuedAt + 1 } },
    { type: 'local', command, point: { kind: 'local', index: 0 }, summary: {} },
    { type: 'section', id: 'journal' },
    { type: 'run', id: 'rows-demo', entries, expanded },
    ...(expanded
      ? entries.map(entry => ({
          type: 'journal' as const,
          entry,
          point: { kind: 'journal' as const, sequence: entry.sequence },
          nested: true,
        }))
      : []),
  ]
  return (
    <div className="w-[280px]">
      <HistoryRowList
        rows={rows}
        selected={selected}
        head={{ kind: 'local', index: 0 }}
        onSelect={setSelected}
      />
      <output aria-label="Selected point">{JSON.stringify(selected)}</output>
    </div>
  )
}

export const CompactRows: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const local = canvas.getByRole('button', { name: /Transaction edited/ })
    expect(local).toHaveAttribute('data-selected')
    await waitFor(() =>
      expect(local.querySelector('[data-overflow]')).not.toBeNull()
    )
    expect(local.scrollWidth).toBeLessThanOrEqual(local.clientWidth)
    const run = canvas.getByRole('button', { name: /2 updates/ })
    run.focus()
    await userEvent.keyboard('{Enter}')
    expect(canvas.getByLabelText('Selected point')).toHaveTextContent(
      '"sequence":2'
    )
    expect(run).toHaveAttribute('data-selected')
    const expand = canvas.getByRole('button', {
      name: 'Show updates one by one',
    })
    expect(run.contains(expand)).toBe(false)
    await userEvent.click(expand)
    expect(
      canvas.getByRole('button', { name: 'Collapse updates' })
    ).toHaveAttribute('aria-expanded', 'true')
    const nested = canvas.getAllByRole('button', { name: /^Update / })
    expect(nested).toHaveLength(2)
    await userEvent.click(nested[1])
    expect(canvas.getByLabelText('Selected point')).toHaveTextContent(
      '"sequence":1'
    )
    expect(nested[1]).toHaveAttribute('data-selected')
  },
}

export const Mobile: Story = {
  ...CompactRows,
  globals: { viewport: { value: 'iphone13' } },
}
