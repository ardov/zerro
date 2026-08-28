import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select as MuiSelect,
} from '@mui/material'
import { MultiSelect, Select, SelectItem, SelectItemText } from './Select'

const meta = {
  title: 'UI/Select',
  parameters: { app: { scenario: 'demo' } },
} satisfies Meta

export default meta
type Story = StoryObj

const options = [
  { value: 'auto', label: 'Auto' },
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
]
const items = Object.fromEntries(options.map(o => [o.value, o.label]))

function Harness() {
  const [value, setValue] = useState('auto')
  return (
    <div className="p-[200px]">
      <Select
        elKey="storySelect"
        label="Visibility"
        value={value}
        onChange={setValue}
        items={items}
        className="w-[240px]"
      />
      <output data-testid="value">{value}</output>
    </div>
  )
}

function MultiHarness() {
  const [value, setValue] = useState<string[]>([])
  return (
    <div className="p-[200px]">
      <MultiSelect
        elKey="storyMultiSelect"
        label="Tags"
        value={value}
        onChange={setValue}
        renderValue={v => `${v.length} selected`}
        className="w-[240px]"
      >
        {options.map(o => (
          <SelectItem key={o.value} value={o.value}>
            <SelectItemText>{o.label}</SelectItemText>
          </SelectItem>
        ))}
      </MultiSelect>
      <output data-testid="value">{value.join(',')}</output>
    </div>
  )
}

export const Picking: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', { name: /Visibility/ })

    // Closed, the trigger reads out the chosen option.
    await expect(trigger).toHaveTextContent('Auto')
    await userEvent.click(trigger)
    const list = await body.findByRole('listbox')

    // Options, not menu items: this is a value picker, not a list of actions.
    await expect(within(list).getAllByRole('option')).toHaveLength(3)
    await userEvent.click(within(list).getByRole('option', { name: /Hidden/ }))
    await waitFor(() =>
      expect(canvas.getByTestId('value')).toHaveTextContent('hidden')
    )
    await waitFor(() => expect(body.queryByRole('listbox')).toBeNull())
    await expect(trigger).toHaveTextContent('Hidden')
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

export const MultipleValues: Story = {
  render: () => <MultiHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', { name: /Tags/ })
    await userEvent.click(trigger)
    const list = await body.findByRole('listbox')

    // Picking does not close a multiple select, so a second value can follow.
    await userEvent.click(within(list).getByRole('option', { name: 'Auto' }))
    await userEvent.click(within(list).getByRole('option', { name: 'Hidden' }))
    await waitFor(() =>
      expect(canvas.getByTestId('value')).toHaveTextContent('auto,hidden')
    )
    await expect(trigger).toHaveTextContent('2 selected')
  },
}

/** The trigger has to be the same box MUI's outlined select draws, because it
 * sits in dialogs beside fields that are still MUI. */
function ParityFields() {
  return (
    <div className="flex flex-wrap gap-8 p-[200px]">
      <div data-testid="mui">
        <FormControl className="w-[240px]">
          <InputLabel id="mui-label" shrink>
            Visibility
          </InputLabel>
          <MuiSelect
            labelId="mui-label"
            label="Visibility"
            value="auto"
            notched
            onChange={() => {}}
          >
            {options.map(o => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </MuiSelect>
        </FormControl>
      </div>
      <div data-testid="owned">
        <Select
          elKey="paritySelect"
          label="Visibility"
          value="auto"
          onChange={() => {}}
          items={items}
          className="w-[240px]"
        />
      </div>
    </div>
  )
}

const measure = (root: HTMLElement) => {
  const control = root.querySelector<HTMLElement>(
    '.MuiSelect-select, [data-slot="input-group"] > button'
  )!
  const fieldset = root.querySelector('fieldset')!
  const s = getComputedStyle(control)
  const border = getComputedStyle(fieldset)
  const rect = control.getBoundingClientRect()
  return {
    height: Math.round(rect.height),
    fontSize: s.fontSize,
    lineHeight: s.lineHeight,
    paddingTop: s.paddingTop,
    paddingBottom: s.paddingBottom,
    paddingLeft: s.paddingLeft,
    paddingRight: s.paddingRight,
    color: s.color,
    border: border.border,
    radius: border.borderRadius,
  }
}

export const OutlinedParity: Story = {
  render: () => <ParityFields />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(measure(canvas.getByTestId('owned'))).toEqual(
      measure(canvas.getByTestId('mui'))
    )
  },
}

export const DarkOutlinedParity: Story = {
  ...OutlinedParity,
  globals: { theme: 'dark' },
}
