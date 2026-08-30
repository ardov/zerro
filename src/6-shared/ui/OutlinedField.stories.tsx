import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { OutlinedField } from './OutlinedField'

const meta = {
  title: 'Library/Input/OutlinedField',
  component: OutlinedField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    className: 'w-[280px]',
    label: 'Name',
    onChange: () => {},
    value: '',
  },
} satisfies Meta<typeof OutlinedField>

export default meta
type Story = StoryObj<typeof meta>

/** Where the label sits and how far the notch is cut open for it. */
const measure = (root: HTMLElement) => {
  const label = root.querySelector('label')!
  const legend = root.querySelector('legend')!
  const s = getComputedStyle(label)
  return {
    transform: s.transform,
    origin: s.transformOrigin,
    fontSize: s.fontSize,
    notch: getComputedStyle(legend).maxWidth,
  }
}

const cases = [
  { size: 'medium', value: '' },
  { size: 'medium', value: 'Groceries' },
  { size: 'small', value: '' },
  { size: 'small', value: 'Groceries' },
] as const

const caseId = (c: (typeof cases)[number]) =>
  `${c.size}-${c.value ? 'filled' : 'empty'}`

function Fields() {
  return (
    <div className="flex flex-col gap-8">
      {cases.map(c => (
        <div key={caseId(c)} data-testid={caseId(c)}>
          <OutlinedField
            size={c.size}
            label="Name"
            value={c.value}
            className="w-[280px]"
            readOnly
          />
        </div>
      ))}
    </div>
  )
}

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

export const Shrink: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Fields />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The numbers themselves, so a matching pair of wrong ones still fails.
    const at = (id: string) => measure(canvas.getByTestId(id))
    const floated = 'matrix(0.75, 0, 0, 0.75, 14, -9)'
    expect(at('medium-empty').transform).toBe('matrix(1, 0, 0, 1, 14, 16)')
    expect(at('small-empty').transform).toBe('matrix(1, 0, 0, 1, 14, 9)')
    expect(at('medium-filled').transform).toBe(floated)
    expect(at('small-filled').transform).toBe(floated)

    // A resting label leaves the border unbroken; a floated one cuts it.
    expect(at('medium-empty').notch).toBe('0.01px')
    expect(parseFloat(at('medium-filled').notch)).toBeGreaterThan(1)
  },
}

const lines = (n: number) =>
  Array.from({ length: n }, (_, i) => `line ${i + 1}`).join('\n')

/** One row, three, and more than the four it is allowed to grow to. */
const multilineCases = [1, 3, 10]

function MultilineFields() {
  return (
    <div className="flex flex-col gap-8">
      {multilineCases.map(n => (
        <div key={n} data-testid={`rows-${n}`}>
          <OutlinedField
            label="Comment"
            value={lines(n)}
            multiline
            maxRows={4}
            size="small"
            className="w-[280px]"
            readOnly
          />
        </div>
      ))}
    </div>
  )
}

const boxOf = (root: HTMLElement) =>
  Math.round(root.querySelector('fieldset')!.getBoundingClientRect().height)

/** A multiline field is as tall as what is in it, up to `maxRows`. */
export const Multiline: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <MultilineFields />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Growing, then capped: ten lines are no taller than four.
    const owned = (n: number) => boxOf(canvas.getByTestId(`rows-${n}`))
    expect(owned(3)).toBeGreaterThan(owned(1))
    expect(owned(10)).toBeLessThan(owned(3) * 2)
  },
}

function GrowingField() {
  const [value, setValue] = useState('')
  return (
    <div data-testid="field">
      <OutlinedField
        label="Comment"
        multiline
        maxRows={4}
        value={value}
        onChange={e => setValue(e.target.value)}
        className="w-[280px]"
      />
    </div>
  )
}

/** The mirror is what makes the field grow, so it has to keep up with typing
 * and stop at `maxRows`. */
export const GrowsWhileTyping: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <GrowingField />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByTestId('field')
    const input = canvas.getByRole('textbox', { name: 'Comment' })

    const oneLine = boxOf(field)
    await userEvent.type(input, 'one{enter}two{enter}three')
    await waitFor(() => expect(boxOf(field)).toBeGreaterThan(oneLine))

    await userEvent.type(input, '{enter}four')
    const capped = boxOf(field)
    await userEvent.type(input, '{enter}five{enter}six')
    await waitFor(() => expect(boxOf(field)).toBe(capped))
  },
}

function EmptyField() {
  const [value, setValue] = useState('')
  return (
    <div data-testid="field">
      <OutlinedField
        label="Name"
        value={value}
        onChange={e => setValue(e.target.value)}
        className="w-[280px]"
      />
      <button type="button">Outside field</button>
    </div>
  )
}

/** Focus floats the label off an empty field, and blurring an empty one drops
 * it back — the state a field that can be cleared spends its time in. */
export const FloatsOnFocus: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <EmptyField />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByTestId('field')
    const input = canvas.getByRole('textbox', { name: 'Name' })
    const resting = 'matrix(1, 0, 0, 1, 14, 16)'
    const floated = 'matrix(0.75, 0, 0, 0.75, 14, -9)'

    expect(measure(field).transform).toBe(resting)
    await userEvent.click(input)
    await waitFor(() => expect(measure(field).transform).toBe(floated))

    // Typed in, it stays up once focus leaves.
    await userEvent.type(input, 'Groceries')
    await userEvent.click(canvas.getByRole('button', { name: 'Outside field' }))
    await waitFor(() => expect(measure(field).transform).toBe(floated))

    await userEvent.clear(input)
    await userEvent.click(canvas.getByRole('button', { name: 'Outside field' }))
    await waitFor(() => expect(measure(field).transform).toBe(resting))
  },
}
