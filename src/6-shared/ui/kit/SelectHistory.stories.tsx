import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { usePopup } from '@/6-shared/overlays'
import { Dialog, DialogContent } from '@/6-shared/ui/Dialog'
import { Select } from './Select'
import { MultiSelect } from './MultiSelect'
import { Button } from './Button'

const items = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
]
function Demo(props: {
  search?: boolean
  multiple?: boolean
  external?: boolean
}) {
  const { search, multiple, external } = props
  const [dialogOpen, setDialogOpen] = usePopup()
  const popup = usePopup()
  const [value, setValue] = useState<string | null>('one')
  const [values, setValues] = useState(['one'])
  const [mounted, setMounted] = useState(true)
  const [disabled, setDisabled] = useState(false)
  const navigate = useNavigate()
  // Storybook uses MemoryRouter: these shortcuts drive its history without
  // an outside click dismissing the popup before Back is exercised.
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (!event.altKey) return
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        navigate(-1)
      }
      if (event.key === 'u') {
        event.preventDefault()
        setMounted(false)
      }
      if (event.key === 'd') {
        event.preventDefault()
        setDisabled(true)
      }
    }
    window.addEventListener('keydown', keydown, true)
    return () => window.removeEventListener('keydown', keydown, true)
  }, [navigate])
  const common = {
    label: 'Choice',
    items,
    search,
    disabled,
    popup: external ? popup : undefined,
  }
  return (
    <>
      <Button
        onClick={() => {
          setMounted(true)
          setDisabled(false)
          setDialogOpen(true)
        }}
      >
        Open editor
      </Button>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        aria-label="Editor"
      >
        <DialogContent className="grid w-80 gap-4">
          {external && (
            <Button onClick={() => popup[1](true)}>Open choice</Button>
          )}
          {mounted &&
            (multiple ? (
              <MultiSelect {...common} value={values} onChange={setValues} />
            ) : (
              <Select
                {...common}
                value={value}
                onChange={setValue}
                alignSelected={!search}
              />
            ))}
          <output aria-label="Value">
            {multiple ? values.join(',') : value}
          </output>
          <Button onClick={() => setDialogOpen(false)}>Close editor</Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
const meta = {
  title: 'UI Kit/Select/History',
  component: Demo,
  parameters: {
    docs: {
      description: {
        component: `Select and MultiSelect require OverlayHost. Back closes the top popup before its parent dialog. Optional programmatic control: pass the pair returned by usePopup as **popup**; arbitrary open/onOpenChange state is not supported. Alt+Left simulates router Back in this MemoryRouter story.`,
      },
    },
  },
} satisfies Meta<typeof Demo>
export default meta
type Story = StoryObj<typeof meta>
const back = () => userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}')
export const Plain: Story = {
  args: {},
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    const opener = canvas.getByRole('button', { name: 'Open editor' })
    await userEvent.click(opener)
    const editor = await body.findByRole('dialog', { name: 'Editor' })
    const trigger = within(editor).getByRole('combobox', { name: /Choice/ })
    await userEvent.click(
      args.external
        ? within(editor).getByRole('button', { name: 'Open choice' })
        : trigger
    )
    await body.findByRole('listbox')
    if (args.search)
      await userEvent.type(
        body.getByRole('combobox', { name: 'Search Choice' }),
        'Two'
      )
    if (args.multiple) {
      await userEvent.click(body.getByRole('option', { name: 'Two' }))
      await expect(within(editor).getByLabelText('Value')).toHaveTextContent(
        'one,two'
      )
    }
    await back()
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(editor).toBeVisible()
    await expect(
      args.external
        ? within(editor).getByRole('button', { name: 'Open choice' })
        : trigger
    ).toHaveFocus()
    await userEvent.click(trigger)
    await body.findByRole('listbox')
    if (args.search)
      await expect(
        body.getByRole('combobox', { name: 'Search Choice' })
      ).toHaveValue('')
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(editor).toBeVisible()
    await back()
    await waitFor(() =>
      expect(
        body.queryByRole('dialog', { name: 'Editor' })
      ).not.toBeInTheDocument()
    )
    await expect(opener).toHaveFocus()
  },
}
export const Search: Story = { ...Plain, args: { search: true } }
export const Multiple: Story = { ...Plain, args: { multiple: true } }
export const MultipleSearch: Story = {
  ...Plain,
  args: { multiple: true, search: true },
}
export const External: Story = {
  ...Plain,
  args: { external: true, search: true },
}
export const Unmount: Story = {
  args: { external: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Open editor' }))
    await userEvent.click(
      await body.findByRole('button', { name: 'Open choice' })
    )
    await body.findByRole('listbox')
    await userEvent.keyboard('{Alt>}u{/Alt}')
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(body.getByRole('dialog', { name: 'Editor' })).toBeVisible()
    await back()
    await waitFor(() =>
      expect(
        body.queryByRole('dialog', { name: 'Editor' })
      ).not.toBeInTheDocument()
    )
  },
}
export const DisabledWhileOpen: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Open editor' }))
    const trigger = await body.findByRole('combobox', { name: /Choice/ })
    await userEvent.click(trigger)
    await body.findByRole('listbox')
    await userEvent.keyboard('{Alt>}d{/Alt}')
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(trigger).toBeDisabled()
    await back()
    await waitFor(() =>
      expect(
        body.queryByRole('dialog', { name: 'Editor' })
      ).not.toBeInTheDocument()
    )
  },
}

export const SelectionClosesLayer: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Open editor' }))
    await userEvent.click(await body.findByRole('combobox', { name: /Choice/ }))
    await userEvent.click(await body.findByRole('option', { name: 'Two' }))
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(body.getByLabelText('Value')).toHaveTextContent('two')
    await back()
    await waitFor(() =>
      expect(
        body.queryByRole('dialog', { name: 'Editor' })
      ).not.toBeInTheDocument()
    )
  },
}
export const SearchSelectionClosesLayer: Story = {
  ...SelectionClosesLayer,
  args: { search: true },
}
