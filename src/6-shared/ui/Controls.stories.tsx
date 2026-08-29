import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Checkbox, CheckboxField } from './Checkbox'
import { CircularProgress } from './CircularProgress'
import { InputBase } from './InputBase'
import { Switch } from './Switch'

const meta = {
  title: 'UI/Controls',
  parameters: { layout: 'padded' },
} satisfies Meta
export default meta
type Story = StoryObj

function CheckboxPreview({ checked }: { checked: boolean }) {
  return <Checkbox checked={checked} />
}

export const CheckboxUnchecked: Story = {
  render: () => <CheckboxPreview checked={false} />,
}
export const CheckboxChecked: Story = {
  render: () => <CheckboxPreview checked />,
}
export const DarkCheckboxChecked: Story = {
  ...CheckboxChecked,
  globals: { theme: 'dark' },
}

export const CheckboxWithLabel: Story = {
  render: function Render() {
    const [checked, setChecked] = useState(true)
    return (
      <CheckboxField
        label="Keep income"
        checked={checked}
        onCheckedChange={setChecked}
      />
    )
  },
}

/** Two sizes: the one the page loader uses and the one that fits in a button. */
export const Spinner: Story = {
  render: () => (
    <div className="flex gap-8">
      <CircularProgress />
      <CircularProgress size={24} />
    </div>
  ),
}

export const SwitchLook: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-8">
        <Switch edge="end" />
      </div>
      <div className="flex gap-8">
        <Switch edge="end" checked />
      </div>
    </div>
  ),
}

/** No decoration of its own: the surface around it belongs to the call site. */
export const Field: Story = {
  render: () => <InputBase placeholder="Search" className="w-[280px]" />,
}

/** `InputBase` uses the same content-sized textarea as the outlined field. */
export const GrowingField: Story = {
  render: function Render() {
    const [value, setValue] = useState('First line')
    return (
      <InputBase
        multiline
        value={value}
        onChange={event => setValue(event.target.value)}
        aria-label="Comment"
        className="w-[280px]"
      />
    )
  },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', {
      name: 'Comment',
    })
    const initialHeight = field.getBoundingClientRect().height
    await userEvent.type(field, '{Enter}Second line')
    await waitFor(() =>
      expect(field.getBoundingClientRect().height).toBeGreaterThan(
        initialHeight
      )
    )
  },
}
