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
    (await canvas.findAllByText(formatDate('2026-09-20'))).at(-1)!
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
