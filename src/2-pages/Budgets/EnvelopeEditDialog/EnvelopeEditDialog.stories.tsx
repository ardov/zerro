import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { MonthProvider } from '../MonthProvider'
import { EnvelopeEditDialog, useEditDialog } from './EnvelopeEditDialog'

const meta = {
  title: 'App/Budgets/EnvelopeEditDialog',
  tags: ['autodocs'],
  parameters: { app: { scenario: 'demo', route: '/budget' } },
} satisfies Meta

export default meta
type Story = StoryObj

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
      if (window.innerWidth < 500) {
        await waitFor(() => expect(name.closest('form')).toHaveFocus())
        await expect(name).not.toHaveFocus()
      } else {
        await waitFor(() => expect(name).toHaveFocus())
      }
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

export const PickingColor: Story = {
  render: () => (
    <MonthProvider>
      <EditHarness />
    </MonthProvider>
  ),
  play: async ({ canvasElement }) => {
    const body = await openDialog(canvasElement)
    const trigger = body.getByRole('button', { name: /^Color$|^Цвет$/ })
    await userEvent.click(trigger)
    const picker = await body.findByRole('dialog', { name: /^Color$|^Цвет$/ })
    await userEvent.click(
      within(picker).getByRole('button', { name: '#CC3077' })
    )
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(trigger.querySelector('span[aria-hidden]')).toHaveStyle({
      backgroundColor: '#CC3077',
    })
    await userEvent.click(trigger)
    await body.findByRole('dialog', { name: /^Color$|^Цвет$/ })
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(trigger.querySelector('span[aria-hidden]')).toHaveStyle({
      backgroundColor: '#CC3077',
    })
  },
}

export const SaveAndValidate: Story = {
  render: PickingFromTheSelects.render,
  play: async ({ canvasElement }) => {
    const body = await openDialog(canvasElement)
    const dialog = body.getByRole('dialog')
    const form = within(dialog)
    const name = form.getByRole('textbox', { name: 'Name' })
    await userEvent.clear(name)
    await userEvent.click(form.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(name).toHaveAttribute('aria-invalid', 'true'))
    await expect(dialog).toBeVisible()
    await userEvent.type(name, 'Food')
    const income = form.getByRole('combobox', { name: /^Income/ })
    const before = income.textContent
    await userEvent.click(income)
    const list = await body.findByRole('listbox')
    const next = within(list)
      .getAllByRole('option')
      .find(option => option.textContent !== before)!
    const selected = next.textContent!
    await userEvent.click(next)
    await expect(
      form.queryByRole('button', { name: 'Clear selection' })
    ).toBeNull()
    await userEvent.click(form.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(dialog).not.toBeVisible())
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Edit envelope' })
    )
    const reopened = await body.findByRole('dialog')
    await expect(
      within(reopened).getByRole('combobox', { name: /^Income/ })
    ).toHaveTextContent(selected)
  },
}

export const Mobile: Story = {
  ...PickingFromTheSelects,
  globals: { viewport: { value: 'zerro499' } },
}
export const MobileSave: Story = {
  ...SaveAndValidate,
  globals: { viewport: { value: 'zerro499' } },
}
export const MobileCancel: Story = {
  ...ReturnsFocusAfterRemount,
  globals: { viewport: { value: 'zerro499' } },
}
export const MobileColor: Story = {
  ...PickingColor,
  globals: { viewport: { value: 'zerro499' } },
}
