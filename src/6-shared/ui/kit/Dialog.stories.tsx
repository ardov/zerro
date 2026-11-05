import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Dialog, DialogSurface } from './Dialog'
import { Popover } from './Popover'
import { Select } from './Select'
import { Menu } from './Menu'
import { Button } from './Button'
import { Input } from './Input'
import { usePopup } from '@/6-shared/overlays'

const meta = {
  tags: ['autodocs'],
  title: 'UI Kit/Overlays/Dialog',
  component: Dialog,
  parameters: {
    controls: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dialog owns history, focus and modal behavior. Supply title (or label), trigger and children. mobile="drawer" opts into a bottom sheet below 500px; default is centered. DialogSurface accepts an existing controller; register close notifications in the owner. All surfaces allow Back to close; onClose is a notification, never a veto. Responsive changes can remount children and discard local input, but do not call onClose. Keep drafts in the owner when needed. Save/Cancel forms save explicitly.',
      },
    },
  },
  args: {
    title: 'Edit details',
    trigger: <Button>Open dialog</Button>,
    children: <Input label="Name" placeholder="Name" />,
  },
} satisfies Meta<typeof Dialog>
export default meta
type Story = StoryObj<typeof meta>

const checkDialog: Story['play'] = async ({ canvasElement, args }) => {
  const trigger = within(canvasElement).getByRole('button', {
    name: 'Open dialog',
  })
  const body = within(canvasElement.ownerDocument.body)
  await userEvent.click(trigger)
  const dialog = await body.findByRole('dialog', { name: 'Edit details' })
  await waitFor(() =>
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
  )
  await userEvent.type(within(dialog).getByRole('textbox'), 'Draft')
  if (args.mobile === 'drawer' && window.innerWidth < 500) {
    await expect(dialog).toHaveAttribute('data-side', 'bottom')
  }
  if (args.mobile === 'drawer' && window.innerWidth < 500) {
    await userEvent.keyboard('{Escape}')
  } else {
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
  }
  await waitFor(() => expect(dialog).not.toBeVisible())
  await waitFor(() => expect(trigger).toHaveFocus())
}
export const Centered: Story = { play: checkDialog }
export const MobileCentered: Story = {
  ...Centered,
  globals: { viewport: { value: 'iphone13' } },
}
export const MobileDrawer: Story = {
  ...MobileCentered,
  args: { mobile: 'drawer' },
}
export const LongContent: Story = {
  args: {
    children: (
      <div className="space-y-4">
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i}>Content paragraph {i + 1}</p>
        ))}
      </div>
    ),
  },
}

function NestedSurfaces() {
  const [value, setValue] = useState<string | null>(null)
  return (
    <Dialog title="Parent" trigger={<Button>Open parent</Button>}>
      <div className="space-y-4">
        <Select
          label="Account"
          value={value}
          onChange={setValue}
          items={[{ value: 'cash', label: 'Cash' }]}
        />
        <Popover title="Child" trigger={<Button>Open child</Button>}>
          <Input label="Child draft" />
        </Popover>
      </div>
    </Dialog>
  )
}
export const Nested: Story = {
  render: () => <NestedSurfaces />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Open parent',
    })
    await userEvent.click(trigger)
    const parent = await body.findByRole('dialog', { name: 'Parent' })
    const account = within(parent).getByRole('combobox')
    await userEvent.click(account)
    await userEvent.click(await body.findByRole('option', { name: 'Cash' }))
    await waitFor(() => expect(account).toHaveFocus())
    const childTrigger = within(parent).getByRole('button', {
      name: 'Open child',
    })
    await userEvent.click(childTrigger)
    const child = await body.findByRole('dialog', { name: 'Child' })
    await userEvent.tab()
    await expect(child).toContainElement(document.activeElement as HTMLElement)
    await dismissOverParent(parent, child, window.innerWidth < 500)
    await waitFor(() => expect(childTrigger).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}
export const NestedMobile: Story = {
  ...Nested,
  globals: { viewport: { value: 'iphone13' } },
}

function MenuDialog() {
  const popup = usePopup()
  return (
    <>
      <Menu
        label="Actions"
        trigger={<Button>Actions</Button>}
        items={[
          { id: 'edit', label: 'Edit', onSelect: () => popup.setOpen(true) },
        ]}
      />
      <Dialog popup={popup} title="Editor">
        <Input label="Name" />
      </Dialog>
    </>
  )
}
export const FromMenu: Story = {
  render: () => <MenuDialog />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Actions' })
    )
    await userEvent.click(await body.findByRole('menuitem', { name: 'Edit' }))
    const editor = await body.findByRole('dialog', { name: 'Editor' })
    await waitFor(() =>
      expect(editor).toContainElement(document.activeElement as HTMLElement)
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(editor).not.toBeVisible())
    await waitFor(() =>
      expect(
        within(canvasElement).getByRole('button', { name: 'Actions' })
      ).toHaveFocus()
    )
  },
}
function Mounted() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open mounted</Button>
      {open && (
        <DialogSurface controller={{ open, setOpen }} label="Mounted">
          <Input label="Draft" />
        </DialogSurface>
      )}
    </>
  )
}
export const MountedOpen: Story = {
  render: () => <Mounted />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Open mounted',
    })
    await userEvent.click(trigger)
    const dialog = await body.findByRole('dialog', { name: 'Mounted' })
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(dialog).not.toBeVisible())
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

function ExplicitSave() {
  const popup = usePopup()
  const [saved, setSaved] = useState('Original')
  const [draft, setDraft] = useState(saved)
  return (
    <>
      <output aria-label="Saved name">{saved}</output>
      <Dialog
        popup={popup}
        title="Name"
        trigger={<Button onClick={() => setDraft(saved)}>Edit name</Button>}
      >
        <div className="space-y-4">
          <Input label="Name" value={draft} onValueChange={setDraft} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => popup.setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setSaved(draft)
                popup.setOpen(false)
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
export const SaveAndCancel: Story = {
  render: () => <ExplicitSave />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Edit name' }))
    let input = await body.findByRole('textbox', { name: 'Name' })
    await userEvent.clear(input)
    await userEvent.type(input, 'Discarded{Escape}')
    await waitFor(() => expect(input).not.toBeVisible())
    await expect(canvas.getByLabelText('Saved name')).toHaveTextContent(
      'Original'
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Edit name' }))
    input = await body.findByRole('textbox', { name: 'Name' })
    await expect(input).toHaveValue('Original')
    await userEvent.clear(input)
    await userEvent.type(input, 'Saved')
    await userEvent.click(body.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(input).not.toBeVisible())
    await expect(canvas.getByLabelText('Saved name')).toHaveTextContent('Saved')
  },
}

/** The child's backdrop must cover the parent's visible area, not just the page. */
async function dismissOverParent(
  parent: HTMLElement,
  child: HTMLElement,
  dimmed = true
) {
  let backdrop: Element | null = null
  await waitFor(() => {
    const bounds = parent.getBoundingClientRect()
    const x = bounds.left + 12
    const y = bounds.top + 12
    const childBounds = child.getBoundingClientRect()
    expect(y < childBounds.top || x < childBounds.left).toBe(true)
    backdrop = document.elementFromPoint(x, y)
    expect(backdrop).toHaveAttribute('role', 'presentation')
    const transparent =
      getComputedStyle(backdrop!).backgroundColor === 'rgba(0, 0, 0, 0)'
    expect(transparent).toBe(!dimmed)
  })
  await userEvent.click(backdrop!)
  await waitFor(() => expect(child).not.toBeVisible())
  await expect(parent).toBeVisible()
}

function StackedDialogs({ fromPopover = false }: { fromPopover?: boolean }) {
  const content = (
    <Dialog
      title="Foreground"
      mobile="drawer"
      trigger={<Button>Open foreground</Button>}
    >
      <p>This window dims everything behind it, including the first window.</p>
    </Dialog>
  )
  const trigger = <Button>Open underlying</Button>
  return fromPopover ? (
    <Popover
      title="Underlying"
      trigger={trigger}
      className="min-h-96"
      mobile="popover"
    >
      {content}
    </Popover>
  ) : (
    <Dialog
      title="Underlying"
      trigger={trigger}
      className="min-h-96"
      mobile="drawer"
    >
      {content}
    </Dialog>
  )
}

const checkStacked: Story['play'] = async ({ canvasElement }) => {
  const body = within(canvasElement.ownerDocument.body)
  await userEvent.click(
    within(canvasElement).getByRole('button', { name: 'Open underlying' })
  )
  const parent = await body.findByRole('dialog', { name: 'Underlying' })
  const trigger = within(parent).getByRole('button', {
    name: 'Open foreground',
  })
  await userEvent.click(trigger)
  const child = await body.findByRole('dialog', { name: 'Foreground' })
  await dismissOverParent(parent, child)
  await waitFor(() => expect(trigger).toHaveFocus())
  await userEvent.keyboard('{Escape}')
}
export const NestedDialogs: Story = {
  render: () => <StackedDialogs />,
  play: checkStacked,
}
export const NestedDrawers: Story = {
  ...NestedDialogs,
  globals: { viewport: { value: 'iphone13' } },
}
export const DialogFromPopover: Story = {
  parameters: { layout: 'padded' },
  render: () => <StackedDialogs fromPopover />,
  play: checkStacked,
}

function OwnerDraft() {
  const [draft, setDraft] = useState('Original')
  const [saved, setSaved] = useState('Original')
  const [closes, setCloses] = useState(0)
  const popup = usePopup(() => {
    setSaved(draft)
    setCloses(count => count + 1)
  })
  return (
    <>
      <output aria-label="Owner saved">{saved}</output>
      <output aria-label="Owner closes">{closes}</output>
      <Button onClick={() => popup.setOpen(true)}>Open owned draft</Button>
      {popup.open && (
        <DialogSurface
          label="Owned draft"
          controller={{ ...popup, setOpen: next => popup.setOpen(next) }}
        >
          <Input label="Owned name" value={draft} onValueChange={setDraft} />
        </DialogSurface>
      )}
    </>
  )
}

/** The owner survives conditional content; wrapping setOpen is harmless. */
export const OwnerCloseNotification: Story = {
  render: () => <OwnerDraft />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open owned draft' })
    )
    const input = await body.findByRole('textbox', { name: 'Owned name' })
    await userEvent.clear(input)
    await userEvent.type(input, 'Latest draft')
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(
        body.queryByRole('dialog', { name: 'Owned draft' })
      ).not.toBeInTheDocument()
    )
    await expect(canvas.getByLabelText('Owner saved')).toHaveTextContent(
      'Latest draft'
    )
    await expect(canvas.getByLabelText('Owner closes')).toHaveTextContent('1')
  },
}

export const Showcase: Story = {
  render: () => (
    <div className="grid gap-4">
      <p className="max-w-lg text-ui-secondary">
        Open a surface, explore its content and press Escape to dismiss. Try a
        narrow viewport to compare adaptive behavior.
      </p>
      <div className="flex flex-wrap gap-3">
        <Dialog
          title="Centered dialog"
          trigger={<Button variant="secondary">Centered dialog</Button>}
        >
          <p className="mb-4">Content can include text, fields and actions.</p>
          <Input label="Name" placeholder="Try typing here" />
        </Dialog>
        <Dialog
          title="Mobile sheet"
          trigger={<Button variant="secondary">Mobile sheet</Button>}
          mobile="drawer"
        >
          <p className="mb-4">Content can include text, fields and actions.</p>
          <Input label="Name" placeholder="Try typing here" />
        </Dialog>
      </div>
    </div>
  ),
}
