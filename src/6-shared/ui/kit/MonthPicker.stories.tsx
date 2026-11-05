import { useState, useRef, useLayoutEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from 'storybook/test'
import { toISOMonth } from '@/6-shared/helpers/date'
import {
  MonthPicker,
  type MonthPickerHandle,
  type MonthPickerProps,
} from './MonthPicker'

const meta = {
  title: 'UI Kit/Inputs/MonthPicker',
  component: MonthPicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Controlled month selection, independent of its surrounding surface. Use value (YYYY-MM or null) and onChange; minMonth/maxMonth are inclusive. An empty picker opens at today, clamped to the bounds. External selections follow their year. Arrow keys move through the three-column grid, skipping disabled months. Left/right at a row edge opens the adjacent year and focuses the opposite edge of that row, within bounds. Keyboard paging is immediate. Tab enters the grid once; Enter/Space selects. Navigation leaves the value unchanged. Shares cell states, spacing and directional year crossfades with Calendar; reduced motion keeps only the fade. Mount afresh for each popup opening to reset the browsed year.',
      },
    },
  },
  args: { value: '2030-06', onChange: fn() },
} satisfies Meta<typeof MonthPicker>
export default meta
type Story = StoryObj<typeof meta>

function Example(props: MonthPickerProps) {
  const [value, setValue] = useState(props.value)
  const ref = useRef<MonthPickerHandle>(null)
  useLayoutEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <div className="grid gap-3">
      <MonthPicker
        {...props}
        ref={ref}
        value={value}
        onChange={month => {
          setValue(month)
          props.onChange(month)
        }}
      />
      <output aria-label="Selected month">{value ?? 'No selection'}</output>
    </div>
  )
}

export const Bench: Story = {
  render: function Bench(args) {
    const [, updateArgs] = useArgs()
    return <MonthPicker {...args} onChange={value => updateArgs({ value })} />
  },
}

const check: Story = {
  tags: ['!dev', '!autodocs'],
  render: args => <Example {...args} />,
}
export const CurrentMonth: Story = {
  ...Bench,
  args: { value: toISOMonth(new Date()) },
}
export const Empty: Story = { ...Bench, args: { value: null } }
export const BoundsAndKeyboard: Story = {
  ...check,
  args: { minMonth: '2030-03', maxMonth: '2031-04' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const grid = () => canvas.getByRole('group', { name: 'Select month' })
    const months = () => within(grid()).getAllByRole('button')
    await expect(months()[5]).toHaveFocus()
    await expect(months()[0]).toBeDisabled()
    await expect(months()[1]).toBeDisabled()
    await userEvent.keyboard('{ArrowUp}{ArrowLeft}{ArrowUp}')
    await expect(months()[2]).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')
    await expect(months()[11]).toHaveFocus()
    await expect(months().filter(button => button.tabIndex === 0)).toHaveLength(
      1
    )
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('status')).toHaveTextContent('2030-12')
    await userEvent.click(canvas.getByRole('button', { name: 'Next year' }))
    await expect(
      canvas.getByRole('button', { name: 'Next year' })
    ).toBeDisabled()
    await expect(months()[4]).toBeDisabled()
    await userEvent.click(months()[3])
    await expect(canvas.getByRole('status')).toHaveTextContent('2031-04')
  },
}

export const ExternalSelection: Story = {
  ...check,
  render: function ExternalSelection(args) {
    const [value, setValue] = useState(args.value)
    return (
      <>
        <MonthPicker {...args} value={value} onChange={setValue} />
        <button onClick={() => setValue('2031-04')}>Set April 2031</button>
      </>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Set April 2031' })
    )
    const months = within(canvas.getByRole('group')).getAllByRole('button')
    await expect(months[3]).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(canvas.getByRole('button', { name: 'Previous year' }))
    await userEvent.click(
      canvas.getByRole('button', { name: 'Set April 2031' })
    )
    // Repeating the same controlled value leaves the browsed year alone.
    await waitFor(() =>
      expect(canvas.getByText('2030', { exact: true })).toBeVisible()
    )
  },
}

export const YearTransition: Story = {
  ...check,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const next = canvas.getByRole('button', { name: 'Next year' })
    next.focus()
    // Observe the outgoing page synchronously, before the transition finishes.
    fireEvent.click(next)
    const outgoing = canvasElement.querySelector<HTMLElement>('[inert]')
    await expect(outgoing).not.toBeNull()
    await expect(outgoing).toHaveAttribute('aria-hidden', 'true')
    await expect(outgoing!.querySelector('[tabindex="0"]')).toBeNull()
    await expect(canvas.getAllByRole('group')).toHaveLength(1)
    await waitFor(() =>
      expect(canvas.getByText('2031', { exact: true })).toBeVisible()
    )
    await expect(next).toHaveFocus()
    await expect(canvas.getByRole('status')).toHaveTextContent('2030-06')
    await waitFor(() => expect(outgoing).not.toBeInTheDocument())
  },
}

export const KeyboardYearPaging: Story = {
  ...check,
  args: {
    value: '2030-03',
    minMonth: '2029-01',
    maxMonth: '2031-12',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const months = () =>
      within(canvas.getByRole('group')).getAllByRole('button')
    await expect(months()[2]).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(months()[0]).toHaveFocus()
    await expect(canvas.getByText('2031', { exact: true })).toBeVisible()
    await userEvent.keyboard('{ArrowLeft}')
    await expect(months()[2]).toHaveFocus()
    await expect(canvas.getByText('2030', { exact: true })).toBeVisible()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}')
    await expect(months()[2]).toHaveFocus()
    await expect(canvas.getByText('2031', { exact: true })).toBeVisible()
    await expect(canvas.getByRole('status')).toHaveTextContent('2030-03')
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('status')).toHaveTextContent('2031-03')
  },
}
