import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Input } from './Input'
import { Textarea } from './Textarea'
import { Select } from './Select'
import { MultiSelect } from './MultiSelect'
import { Chip } from './Chip'
import { Calendar } from './Calendar'
import type { TISODate } from '@/6-shared/types'
import { Dialog } from './Dialog'
import { Drawer } from './Drawer'
import { Popover } from './Popover'
import { Menu } from './Menu'
import { Tooltip, TooltipProvider } from './Tooltip'

const meta = {
  title: 'UI Kit/Welcome',
  parameters: { layout: 'fullscreen', controls: { disable: true } },
} satisfies Meta
export default meta

const accounts = [
  { value: 'everyday', label: 'Everyday account' },
  { value: 'savings', label: 'Savings' },
  { value: 'cash', label: 'Cash' },
]

function Gallery() {
  const reset = useRef<HTMLButtonElement>(null)
  const [account, setAccount] = useState<string | null>('everyday')
  const [selected, setSelected] = useState(['everyday'])
  const [tags, setTags] = useState(['Groceries', 'Travel', 'Coffee'])
  const [date, setDate] = useState<TISODate | null>('2026-09-22')
  const [message, setMessage] = useState('Ready to try an action.')
  return (
    <main className="min-h-screen bg-ui-base p-6 text-ui-16 text-ui-primary">
      <div className="mx-auto grid max-w-4xl gap-8">
        <header className="grid gap-3">
          <h1 className="text-ui-20 font-medium">UI Kit</h1>
          <p className="max-w-2xl text-ui-secondary">
            A collection of working components. Type into fields, choose
            accounts, remove a chip or open a surface. Use the toolbar to
            compare light and dark themes and narrow screens.
          </p>
          <p className="max-w-2xl text-ui-14 text-ui-secondary">
            Browse Actions, Inputs, Overlays and Data display for everyday use.
            Foundations covers visual roles; Building blocks covers composition.
            Each component has a Docs page with usage guidance. Behavior
            contains focused history scenarios.
          </p>
        </header>
        <section className="grid gap-4 rounded-ui-card bg-ui-card p-6">
          <h2 className="text-ui-20 font-medium">Actions and feedback</h2>
          <p className="text-ui-secondary">
            Choose an emphasis that matches the action. Hover or focus Help for
            a tooltip.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setMessage('Changes saved.')}>
              Save changes
            </Button>
            <Button
              variant="secondary"
              onClick={() => setMessage('Preview opened.')}
            >
              Preview
            </Button>
            <Button
              variant="ghost"
              ref={reset}
              onClick={() => {
                setTags(['Groceries', 'Travel', 'Coffee'])
                setMessage('Examples reset.')
              }}
            >
              Reset chips
            </Button>
            <TooltipProvider>
              <Tooltip content="Use Tab to explore keyboard focus too.">
                <Button variant="outline">Help</Button>
              </Tooltip>
            </TooltipProvider>
            <Button disabled>Unavailable</Button>
          </div>
          <p role="status" className="text-ui-14 text-ui-secondary">
            {message}
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Chip
                key={tag}
                onRemove={() => {
                  setTags(current => current.filter(value => value !== tag))
                  reset.current?.focus()
                }}
              >
                {tag}
              </Chip>
            ))}
          </div>
        </section>
        <section className="grid gap-4 rounded-ui-card bg-ui-card p-6">
          <h2 className="text-ui-20 font-medium">Inputs and selection</h2>
          <p className="text-ui-secondary">
            Single selection closes after a choice. Multiple selection stays
            open so you can keep choosing.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Envelope name"
              labelMode="floating"
              defaultValue="Groceries"
            />
            <Input label="Monthly limit" placeholder="Enter an amount" />
            <Select
              label="Account"
              items={accounts}
              value={account}
              onChange={setAccount}
            />
            <MultiSelect
              search
              label="Included accounts"
              items={accounts}
              value={selected}
              onChange={setSelected}
            />
            <Textarea
              label="Notes"
              placeholder="Add a note and try multiple lines"
            />
            <Input
              label="Required name"
              placeholder="Required name"
              error="Enter a name to continue"
            />
          </div>
        </section>
        <section className="grid gap-4 rounded-ui-card rounded-smooth bg-ui-card p-6">
          <h2 className="text-ui-20 font-medium">Calendar</h2>
          <p className="text-ui-secondary">
            Choose a day or browse months. The six-week grid keeps its height.
          </p>
          <Calendar value={date} onChange={setDate} />
        </section>
        <section className="grid gap-4 rounded-ui-card bg-ui-card p-6">
          <h2 className="text-ui-20 font-medium">Overlays</h2>
          <p className="text-ui-secondary">
            Open each surface and dismiss it with Escape or its backdrop. Focus
            returns to the opener. Menus and popovers adapt to bottom sheets
            below 500px.
          </p>
          <div className="flex flex-wrap gap-3">
            <Dialog
              title="Edit envelope"
              trigger={<Button variant="secondary">Dialog</Button>}
            >
              <Input label="Name" defaultValue="Groceries" />
            </Dialog>
            <Drawer
              title="Account details"
              trigger={<Button variant="secondary">Drawer</Button>}
            >
              <p>Review account information alongside your current task.</p>
            </Drawer>
            <Popover
              title="Quick note"
              trigger={<Button variant="secondary">Popover</Button>}
            >
              <Textarea label="Note" />
            </Popover>
            <Menu
              label="Envelope actions"
              trigger={<Button variant="secondary">Menu</Button>}
              items={[
                {
                  id: 'duplicate',
                  label: 'Duplicate',
                  onSelect: () => setMessage('Envelope duplicated.'),
                },
                {
                  id: 'archive',
                  label: 'Archive',
                  onSelect: () => setMessage('Envelope archived.'),
                },
              ]}
            />
          </div>
        </section>
      </div>
    </main>
  )
}

export const Showcase: StoryObj<typeof meta> = { render: () => <Gallery /> }
