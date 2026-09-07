import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import {
  AccountIcon,
  ChevronDownIcon,
  NotesIcon,
  CalendarIcon,
  PlaceIcon,
} from './Icons'
import {
  FilledButton,
  FilledField,
  FilledInput,
  filledFieldActionClass,
} from './FilledField'

const meta = {
  title: 'Library/Inputs/FilledField',
  component: FilledInput,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { placeholder: 'Place', icon: <PlaceIcon size={20} /> },
} satisfies Meta<typeof FilledInput>
export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

/** Every shape the family has: an input, a button that opens a selector, a
 * frame holding two controls, and a row that grows with its text. */
function VariantShowcase() {
  const [text, setText] = useState('')
  const [comment, setComment] = useState('One line, then another one')
  return (
    <div className="flex w-[320px] flex-col gap-3">
      <FilledInput
        icon={<PlaceIcon size={20} />}
        placeholder="Place"
        aria-label="Place"
        value={text}
        onChange={event => setText(event.target.value)}
      />
      <FilledButton
        icon={<AccountIcon size={20} />}
        trailing={
          <ChevronDownIcon size={20} className="text-icon-foreground" />
        }
      >
        Cash RUB
      </FilledButton>
      <FilledField icon={<CalendarIcon size={20} />}>
        <span className="flex-auto">20.06.2026</span>
        <span className="text-muted-foreground">18:56</span>
      </FilledField>
      <FilledInput
        icon={<NotesIcon size={20} />}
        placeholder="Comment"
        aria-label="Comment"
        multiline
        maxRows={4}
        value={comment}
        onChange={event => setComment(event.target.value)}
      />
      <FilledInput
        icon={<PlaceIcon size={20} />}
        placeholder="Disabled"
        aria-label="Disabled"
        disabled
      />
      {/* Two rows that belong together close up into one block. */}
      <div className="flex flex-col gap-0.5">
        <FilledButton
          className="rounded-b-md"
          icon={<AccountIcon size={20} />}
          trailing={
            <ChevronDownIcon size={20} className="text-icon-foreground" />
          }
        >
          Cash RUB
        </FilledButton>
        <FilledField className="rounded-t-md" icon={<PlaceIcon size={20} />}>
          <span className="flex-auto">12 000</span>
          <span className="text-muted-foreground">RUB</span>
        </FilledField>
      </div>
    </div>
  )
}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => <VariantShowcase />,
}

/** Every state the frame has, in the order the design lays them out: what it
 * is at rest, what the pointer does to it, and what the caret does. */
function StateShowcase() {
  const rows = [
    { name: 'Editable', props: {} },
    {
      name: 'Invalid',
      props: { invalid: true, error: 'Это поле обязательное' },
    },
    { name: 'Readonly', props: { readOnly: true } },
    { name: 'Disabled', props: { disabled: true } },
  ] as const
  return (
    <div className="flex flex-col gap-6">
      {rows.map(row => (
        <div key={row.name} className="flex flex-col gap-2">
          <span className="text-caption text-muted-foreground">{row.name}</span>
          <div className="flex w-[720px] gap-4">
            <FilledInput
              icon={<NotesIcon size={20} />}
              placeholder="Комментарий"
              aria-label={row.name}
              {...row.props}
            />
            <FilledButton
              icon={<AccountIcon size={20} />}
              trailing={
                <ChevronDownIcon size={20} className="text-icon-foreground" />
              }
              disabled={'disabled' in row.props}
            >
              Cash RUB
            </FilledButton>
          </div>
        </div>
      ))}
    </div>
  )
}

export const States: Story = {
  tags: ['!test'],
  render: () => <StateShowcase />,
}

/** The whole row is the target.
 *
 * A field is a place to type in, and the icon and the padding around it are
 * part of that place — clicking either puts the caret in the control. The
 * assertion is on that rather than on the border it also lights up: the
 * border is transitioned, so reading its colour straight after the click
 * reads the colour the transition started from. */
export const FocusCheck: Story = {
  tags: ['!autodocs'],
  args: { 'aria-label': 'Place' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Place' })
    const frame = input.closest('[data-slot="filled-field"]')!
    const box = frame.getBoundingClientRect()

    await expect(input).not.toHaveFocus()
    // The icon, at the far left of the row.
    await userEvent.pointer({
      target: frame,
      coords: { clientX: box.left + 10, clientY: box.top + box.height / 2 },
      keys: '[MouseLeft]',
    })
    await expect(input).toHaveFocus()

    input.blur()
    // And the empty end of it.
    await userEvent.pointer({
      target: frame,
      coords: { clientX: box.right - 6, clientY: box.top + box.height / 2 },
      keys: '[MouseLeft]',
    })
    await expect(input).toHaveFocus()
  },
}

/** Leading content occupies one 48px square. Without it, text keeps 16px. */
export const AlignmentCheck: Story = {
  tags: ['!autodocs'],
  args: {},
  render: () => (
    <div className="flex w-[320px] flex-col gap-3">
      <FilledInput
        icon={<PlaceIcon size={20} />}
        aria-label="With icon"
        value="With icon"
        readOnly
      />
      <FilledInput aria-label="Without icon" value="Without icon" readOnly />
      <FilledField>
        <button
          type="button"
          aria-label="Calendar"
          className={filledFieldActionClass}
        >
          <CalendarIcon size={20} />
        </button>
        <span>After action</span>
      </FilledField>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const withIcon = canvas.getByRole('textbox', { name: 'With icon' })
    const withoutIcon = canvas.getByRole('textbox', { name: 'Without icon' })
    const action = canvas.getByRole('button', { name: 'Calendar' })
    const afterAction = canvas.getByText('After action')
    const icon = withIcon
      .closest('[data-slot="filled-field"]')!
      .querySelector('[data-slot="filled-field-icon"]')!

    const offset = (element: Element, frame: Element) =>
      element.getBoundingClientRect().left - frame.getBoundingClientRect().left
    const centre = (element: Element, frame: Element) => {
      const box = element.getBoundingClientRect()
      return box.left + box.width / 2 - frame.getBoundingClientRect().left
    }

    const iconFrame = withIcon.closest('[data-slot="filled-field"]')!
    expect(offset(withIcon, iconFrame)).toBeCloseTo(48, 1)
    expect(centre(icon, iconFrame)).toBeCloseTo(24, 1)

    const plainFrame = withoutIcon.closest('[data-slot="filled-field"]')!
    expect(offset(withoutIcon, plainFrame)).toBeCloseTo(16, 1)

    const actionFrame = action.closest('[data-slot="filled-field"]')!
    expect(offset(afterAction, actionFrame)).toBeCloseTo(48, 1)
    expect(centre(action, actionFrame)).toBeCloseTo(24, 1)
  },
}
