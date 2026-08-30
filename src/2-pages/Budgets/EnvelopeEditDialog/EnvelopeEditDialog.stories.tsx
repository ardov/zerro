import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useAppSelector } from 'store'
import { core } from 'zerro-core/redux'
import { MonthProvider } from '../MonthProvider'
import { EnvelopeEditDialog, useEditDialog } from './EnvelopeEditDialog'

const meta = {
  title: 'Budget/Envelope edit dialog',
  parameters: { app: { scenario: 'demo', route: '/budget' } },
} satisfies Meta

export default meta
type Story = StoryObj

/** The two selects in this form are the reason this story exists. The shared
 * `Select` reports values directly, so the form adapter rebuilds the event
 * shape that Formik's `handleChange` expects; the shared
 * one hands over the value and the form uses `setFieldValue`. Nothing else
 * checks that the picked value reaches the form. */
function EditHarness() {
  const open = useEditDialog()
  // The same selector the envelope preview edits from: the metrics entry for
  // an envelope is a different shape and has no `originalName`.
  const envelopes = useAppSelector(core.envelopes.selectAll)
  const envelope = Object.values(envelopes).find(e => e.name === 'Food')!
  return (
    <>
      <button type="button" onClick={() => open(envelope.id)}>
        Edit envelope
      </button>
      <EnvelopeEditDialog />
    </>
  )
}

const openDialog = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  await userEvent.click(canvas.getByRole('button', { name: 'Edit envelope' }))
  await body.findByRole('dialog')
  return body
}

export const PickingFromTheSelects: Story = {
  render: () => (
    <MonthProvider>
      <EditHarness />
    </MonthProvider>
  ),
  play: async ({ canvasElement }) => {
    const body = await openDialog(canvasElement)

    const visibility = body.getByRole('combobox', {
      name: /Show in budget|Показывать/i,
    })
    const before = visibility.textContent
    await userEvent.click(visibility)
    const list = await body.findByRole('listbox')
    const options = within(list).getAllByRole('option')
    const next = options.find(o => o.textContent !== before)!
    const nextLabel = next.textContent
    await userEvent.click(next)

    // The picked value has to reach formik, which is the whole point of the
    // change from `handleChange` to `setFieldValue`.
    await waitFor(() => expect(body.queryByRole('listbox')).toBeNull())
    await waitFor(() => expect(visibility).toHaveTextContent(nextLabel!))

    // The currency select renders two lines per row and shows only the code
    // when closed.
    const currency = body.getByRole('combobox', { name: /Currency|Валюта/i })
    await userEvent.click(currency)
    const codes = await body.findByRole('listbox')
    const code = within(codes).getAllByRole('option')[0]
    const chosen = code.textContent!.slice(0, 3)
    await userEvent.click(code)
    await waitFor(() => expect(currency).toHaveTextContent(chosen))
  },
}

export const ReturnsFocusAfterRemount: Story = {
  render: PickingFromTheSelects.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('button', { name: 'Edit envelope' })

    for (let i = 0; i < 2; i++) {
      await userEvent.click(trigger)
      const dialog = await body.findByRole('dialog')
      const name = within(dialog).getByRole('textbox', { name: 'Name' })
      await waitFor(() => expect(name).toHaveFocus())
      await expect(name).toHaveValue('Food')
      await userEvent.clear(name)
      await userEvent.type(name, 'Discard this draft')
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Cancel' })
      )
      await waitFor(() => expect(dialog).not.toBeVisible())
      await waitFor(() => expect(trigger).toHaveFocus())
    }
  },
}
