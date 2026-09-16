import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, within, waitFor } from 'storybook/test'
import { useNavigate } from 'react-router-dom'
import { usePopup } from '@/6-shared/overlays'
import { Menu, ContextMenu, type MenuItem } from './Menu'
import { Drawer } from './Drawer'
import { Button } from './Button'

function Demo(props: { context?: boolean }) {
  const { context } = props
  const [checked, setChecked] = useState(false)
  const dialog = usePopup()
  const navigate = useNavigate()
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault()
        navigate(-1)
      }
    }
    window.addEventListener('keydown', key, true)
    return () => window.removeEventListener('keydown', key, true)
  }, [navigate])
  const items: MenuItem[] = [
    { id: 'edit', label: 'Edit', onSelect: () => dialog.setOpen(true) },
    {
      id: 'disabled',
      label: 'Unavailable',
      disabled: true,
      onSelect: () => {
        throw new Error('disabled action')
      },
    },
    {
      id: 'check',
      type: 'checkbox',
      label: 'Show hidden',
      checked,
      onCheckedChange: setChecked,
    },
    { id: 'separator', type: 'separator' },
    {
      id: 'delete',
      label: 'Delete',
      destructive: true,
      onSelect: () => setChecked(false),
    },
  ]
  return (
    <>
      {context ? (
        <ContextMenu
          label="Actions"
          items={items}
          trigger={
            <div className="rounded-ui-card bg-ui-card p-12 focusable">
              Context area
            </div>
          }
        />
      ) : (
        <Menu
          label="Actions"
          items={items}
          trigger={<Button>Actions</Button>}
        />
      )}
      <output aria-label="Hidden">{String(checked)}</output>
      <Drawer label="Editor" popup={dialog}>
        <p className="p-4">Editing</p>
      </Drawer>
    </>
  )
}
const meta = {
  title: 'UI Kit/Menu',
  component: Menu,
  args: { label: 'Actions', items: [], trigger: <Button>Actions</Button> },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Menu and ContextMenu share items. Desktop uses Base UI menus; screens below 500px use a modal Drawer with buttons and checkboxes. Set mobile="popover" to keep the anchored menu. Actions run immediately while the surface closes; checkbox items keep the surface open. History requires OverlayHost in a Router. Context areas support right click, long press and Shift+F10; always provide a visible alternative. Example: <Menu label="Actions" trigger={<Button>Actions</Button>} items={items} />.',
      },
    },
  },
  render: () => <Demo />,
} satisfies Meta<typeof Menu>
export default meta
type Story = StoryObj<typeof meta>
export const Desktop: Story = {
  globals: { viewport: { value: 'zerro500' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }))
    const menu = await body.findByRole('menu')
    await userEvent.click(within(menu).getByRole('menuitemcheckbox'))
    await expect(canvasElement.querySelector('output')).toHaveTextContent(
      'true'
    )
    await waitFor(() => expect(menu).toBeVisible())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(menu).not.toBeVisible())
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Edit' }))
    const editor = await body.findByRole('dialog', { name: 'Editor' })
    // Check after exit transitions too: the old menu must not steal editor focus.
    await new Promise(resolve => setTimeout(resolve, 350))
    await expect(
      editor.contains(canvasElement.ownerDocument.activeElement)
    ).toBe(true)
    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}')
    await waitFor(() => expect(editor).not.toBeVisible())
    await expect(body.queryByRole('menu')).not.toBeInTheDocument()
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Actions' })).toHaveFocus()
    )
  },
}
export const Mobile: Story = {
  globals: { viewport: { value: 'zerro499' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('button', { name: 'Actions' })
    await userEvent.click(trigger)
    const sheet = await body.findByRole('dialog', { name: 'Actions' })
    await userEvent.click(
      within(sheet).getByRole('checkbox', { name: 'Show hidden' })
    )
    await expect(canvasElement.querySelector('output')).toHaveTextContent(
      'true'
    )
    await expect(sheet).toBeVisible()
    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}')
    await waitFor(() => expect(sheet).not.toBeVisible())
    await userEvent.click(trigger)
    await userEvent.click(await body.findByRole('button', { name: 'Edit' }))
    const editor = await body.findByRole('dialog', { name: 'Editor' })
    // Check after exit transitions too: the old menu must not steal editor focus.
    await new Promise(resolve => setTimeout(resolve, 350))
    await expect(
      editor.contains(canvasElement.ownerDocument.activeElement)
    ).toBe(true)
    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}')
    await waitFor(() => expect(editor).not.toBeVisible())
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}
export const ContextDesktop: Story = {
  globals: Desktop.globals,
  render: () => <Demo context />,
  play: async ({ canvasElement }) => {
    const area = within(canvasElement).getByText('Context area')
    const body = within(canvasElement.ownerDocument.body)
    fireEvent.contextMenu(area, { clientX: 100, clientY: 100 })
    const menu = await body.findByRole('menu')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(menu).not.toBeVisible())
    area.focus()
    await userEvent.keyboard('{Shift>}{F10}{/Shift}')
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible())
    await userEvent.keyboard('{Escape}')
  },
}
export const ContextMobile: Story = {
  globals: Mobile.globals,
  render: () => <Demo context />,
  play: async ({ canvasElement }) => {
    const area = within(canvasElement).getByText('Context area')
    const body = within(canvasElement.ownerDocument.body)
    const touch = (clientY: number) =>
      new Touch({ identifier: 1, target: area, clientX: 100, clientY })
    fireEvent.touchStart(area, { touches: [touch(100)] })
    const sheet = await body.findByRole('dialog', { name: 'Actions' })
    fireEvent.touchEnd(area, { touches: [], changedTouches: [touch(100)] })
    await waitFor(() =>
      expect(sheet.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        window.innerHeight + 1
      )
    )
    const y = sheet.getBoundingClientRect().top + 10
    const swipe = (clientY: number) =>
      new Touch({ identifier: 2, target: sheet, clientX: 100, clientY })
    fireEvent.touchStart(sheet, {
      touches: [swipe(y)],
      changedTouches: [swipe(y)],
    })
    fireEvent.touchMove(sheet, {
      touches: [swipe(y + 40)],
      changedTouches: [swipe(y + 40)],
    })
    fireEvent.touchMove(sheet, {
      touches: [swipe(window.innerHeight)],
      changedTouches: [swipe(window.innerHeight)],
    })
    fireEvent.touchEnd(sheet, {
      touches: [],
      changedTouches: [swipe(window.innerHeight)],
    })
    await waitFor(() => expect(sheet).not.toBeVisible())
  },
}

export const ContextCancelledTouch: Story = {
  globals: Mobile.globals,
  render: () => <Demo context />,
  play: async ({ canvasElement }) => {
    const area = within(canvasElement).getByText('Context area')
    const body = within(canvasElement.ownerDocument.body)
    const touch = (clientY: number) =>
      new Touch({ identifier: 1, target: area, clientX: 100, clientY })
    fireEvent.touchStart(area, { touches: [touch(100)] })
    fireEvent.touchMove(area, { touches: [touch(130)] })
    await new Promise(resolve => setTimeout(resolve, 600))
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.touchEnd(area, { touches: [], changedTouches: [touch(130)] })
  },
}

export const NativeContext: Story = {
  render: () => (
    <ContextMenu
      label="Actions"
      items={[]}
      trigger={
        <div className="p-8">
          <input aria-label="Text" defaultValue="Native editing" />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox')
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(event)
    await expect(event.defaultPrevented).toBe(false)
    await expect(
      within(canvasElement.ownerDocument.body).queryByRole('menu')
    ).not.toBeInTheDocument()
  },
}

export const ActionFocus: Story = {
  globals: Desktop.globals,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Actions',
    })
    const body = within(canvasElement.ownerDocument.body)
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    const item = await body.findByRole('menuitem', { name: 'Delete' })
    item.focus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() =>
      expect(body.queryByRole('menu')).not.toBeInTheDocument()
    )
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

export const MobileActionFocus: Story = {
  globals: Mobile.globals,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Actions',
    })
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(trigger)
    const item = await body.findByRole('button', { name: 'Delete' })
    item.focus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() =>
      expect(body.queryByRole('dialog')).not.toBeInTheDocument()
    )
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

export const LongLabel: Story = {
  globals: Desktop.globals,
  render: () => (
    <Menu
      label="Actions"
      trigger={<Button>Actions</Button>}
      items={[
        {
          id: 'long',
          label: 'A very long action label '.repeat(30),
          onSelect: () => {},
        },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Actions' })
    )
    const menu = await within(canvasElement.ownerDocument.body).findByRole(
      'menu'
    )
    await waitFor(() => {
      const bounds = menu.getBoundingClientRect()
      expect(bounds.left).toBeGreaterThanOrEqual(0)
      expect(bounds.right).toBeLessThanOrEqual(window.innerWidth)
      expect(menu.scrollWidth).toBeLessThanOrEqual(menu.clientWidth)
    })
    await userEvent.keyboard('{Escape}')
  },
}

export const NativeContextTargets: Story = {
  render: () => (
    <ContextMenu
      label="Actions"
      items={[]}
      trigger={
        <div className="p-8">
          <a href="#native">Link</a>
          <input aria-label="Input" />
          <textarea aria-label="Textarea" />
          <select aria-label="Select">
            <option>Option</option>
          </select>
          <div contentEditable suppressContentEditableWarning>
            Editable
          </div>
          <div contentEditable={false}>Not editable</div>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const targets = [
      canvas.getByRole('link'),
      canvas.getByRole('textbox', { name: 'Input' }),
      canvas.getByRole('textbox', { name: 'Textarea' }),
      canvas.getByRole('combobox'),
      canvas.getByText('Editable'),
    ]
    for (const target of targets) {
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
      })
      target.dispatchEvent(event)
      await expect(event.defaultPrevented).toBe(false)
    }
    fireEvent.contextMenu(canvas.getByText('Not editable'))
    await within(canvasElement.ownerDocument.body).findByRole('menu')
    await userEvent.keyboard('{Escape}')
  },
}

export const FixedMobilePopover: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => (
    <Menu
      label="Fixed actions"
      mobile="popover"
      trigger={<Button>Actions</Button>}
      items={[{ id: 'edit', label: 'Edit', onSelect: () => {} }]}
    />
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Actions',
    })
    await userEvent.click(trigger)
    const body = within(canvasElement.ownerDocument.body)
    const menu = await body.findByRole('menu', { name: 'Fixed actions' })
    await waitFor(() => expect(menu).toBeVisible())
    await expect(body.queryByRole('dialog')).toBeNull()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}
