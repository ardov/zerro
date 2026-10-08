import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { defineScreen, usePopup } from '@/6-shared/overlays'
import { DrawerSurface } from './Drawer'
import { Select } from './Select'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import {
  TransactionPreviewDrawer,
  useTransactionPreview,
} from '@/3-widgets/global/TransactionPreviewDrawer'

const editorScreen = defineScreen<string>('back-editor')
const items = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
]

function Demo({ popupParent = false, search = false }) {
  const [id, setId] = editorScreen.use()
  const popup = usePopup()
  const controller = popupParent
    ? popup
    : {
        open: !!id,
        setOpen: (open: boolean) => setId(open ? 'editor' : null),
      }
  return (
    <>
      <button onClick={() => controller.setOpen(true)}>Open editor</button>
      <DrawerSurface controller={controller} label="Editor">
        <Select
          label="Choice"
          value="one"
          items={items}
          onChange={() => {}}
          search={search}
        />
      </DrawerSurface>
    </>
  )
}

// Capture real browser watchers, preserving their one-shot lifecycle. With
// STORYBOOK_ANDROID=1 this reaches Base UI's Android-only Back handler.
// On desktop there is no watcher and Back goes through router history.
type Watcher = EventTarget & { close(): void; destroy(): void }
const browser = window as typeof window & {
  CloseWatcher: new (options?: { signal?: AbortSignal }) => Watcher
}
let watchers: Watcher[] = []
const meta = {
  title: 'UI Kit/Behavior/Drawer Back',
  component: Demo,
  parameters: { historyShortcuts: true },
  globals: { viewport: { value: 'iphone13' } },
  beforeEach: () => {
    const NativeWatcher = browser.CloseWatcher
    watchers = []
    if (!NativeWatcher) return undefined
    browser.CloseWatcher = class extends NativeWatcher {
      constructor(options?: { signal?: AbortSignal }) {
        super(options)
        watchers.push(this)
      }
      override destroy() {
        watchers = watchers.filter(watcher => watcher !== this)
        super.destroy()
      }
    }
    return () => {
      browser.CloseWatcher = NativeWatcher
      watchers = []
    }
  },
} satisfies Meta<typeof Demo>
export default meta
type Story = StoryObj<typeof meta>

async function back() {
  const watcher = watchers.pop()
  if (watcher) watcher.close()
  else await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}')
}

export const Screen: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const opener = canvas.getByRole('button', { name: 'Open editor' })
    // Reopening also checks that a consumed CloseWatcher does not poison the
    // next opening. The second Back must close the editor, not leave a slot.
    for (let attempt = 0; attempt < 2; attempt++) {
      await userEvent.click(opener)
      const editor = await body.findByRole('dialog', { name: 'Editor' })
      const trigger = within(editor).getByRole('combobox', { name: /Choice/ })
      await userEvent.click(trigger)
      await body.findByRole('listbox')
      if (/Android/i.test(navigator.userAgent))
        expect(watchers.length).toBeGreaterThan(0)
      await back()
      await waitFor(() =>
        expect(body.queryByRole('listbox')).not.toBeInTheDocument()
      )
      // Let the parent's exit finish too: an immediate visibility assertion
      // would pass while a wrongly closed drawer is still animating away.
      await new Promise(resolve => setTimeout(resolve, 400))
      await expect(editor).toBeVisible()
      await waitFor(() => expect(trigger).toHaveFocus())
      await back()
      await waitFor(() =>
        expect(
          body.queryByRole('dialog', { name: 'Editor' })
        ).not.toBeInTheDocument()
      )
      await waitFor(() => expect(opener).toHaveFocus())
    }
  },
}
export const Popup: Story = { ...Screen, args: { popupParent: true } }
export const Search: Story = { ...Screen, args: { search: true } }

function TransactionDemo() {
  const transactions = useAppSelector(core.transactions.selectAll)
  const open = useTransactionPreview()
  const transaction = Object.values(transactions).find(one => !one.deleted)
  return (
    <>
      <button onClick={() => transaction && open(transaction.id)}>
        Open transaction
      </button>
      <TransactionPreviewDrawer />
    </>
  )
}
export const Transaction: Story = {
  parameters: { app: { scenario: 'demo', route: '/transactions' } },
  render: () => <TransactionDemo />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Open transaction' })
    )
    const editor = await body.findByRole('dialog', { name: 'Transaction' })
    const trigger = within(editor).getByRole('combobox', {
      name: 'Transaction type',
    })
    await userEvent.click(trigger)
    await body.findByRole('listbox')
    if (/Android/i.test(navigator.userAgent))
      expect(watchers.length).toBeGreaterThan(0)
    await back()
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await new Promise(resolve => setTimeout(resolve, 400))
    await expect(editor).toBeVisible()
    await waitFor(() => expect(trigger).toHaveFocus())
    await back()
    await waitFor(() =>
      expect(
        body.queryByRole('dialog', { name: 'Transaction' })
      ).not.toBeInTheDocument()
    )
  },
}
