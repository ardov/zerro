import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import { Checkbox, CheckboxField } from './Checkbox'
import { Switch, SwitchField } from './Switch'

const meta = {
  title: 'UI Kit/Inputs/Checkbox and Switch',
  component: Checkbox,
  subcomponents: { Switch, CheckboxField, SwitchField },
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    a11y: { test: 'error' },
    docs: {
      description: {
        component: `Standalone controls with the same state API: use checked + onCheckedChange for controlled values, or defaultChecked for uncontrolled values. For resettable forms, use controlled values and restore them in the form owner. The root ref addresses the focusable control; inputRef addresses the hidden form input.

Use CheckboxField or SwitchField for a clickable label. Plain controls need a label or aria-label. Keep links and other actions outside the clickable label. Never put these interactive controls inside a button or menu item.

Checkbox indeterminate is a separate, derived flag. A select-all owner computes checked and indeterminate from its children and selects all when partly selected; the component does not cycle through three states. Use explicit controlled children for groups.

Minimal examples: <Checkbox defaultChecked aria-label="Include account" /> and <SwitchField label="Notifications" checked={enabled} onCheckedChange={setEnabled} />.`,
      },
    },
  },
  decorators: [
    Story => (
      <main className="min-h-screen bg-ui-base p-6 text-ui-primary">
        <div className="mx-auto grid max-w-3xl gap-8">
          <Story />
        </div>
      </main>
    ),
  ],
} satisfies Meta<typeof Checkbox>
export default meta
type Story = StoryObj<typeof meta>

function SelectionExample() {
  const [selected, setSelected] = useState(['everyday'])
  const accounts = ['everyday', 'savings', 'cash']
  return (
    <section aria-label="Account selection" className="grid gap-1">
      <CheckboxField
        label="All accounts"
        checked={selected.length === accounts.length}
        indeterminate={selected.length > 0 && selected.length < accounts.length}
        onCheckedChange={checked => setSelected(checked ? accounts : [])}
      />
      <div className="grid gap-1 ps-8">
        {accounts.map(account => (
          <CheckboxField
            key={account}
            label={account[0].toUpperCase() + account.slice(1)}
            checked={selected.includes(account)}
            onCheckedChange={checked =>
              setSelected(current =>
                checked
                  ? [...current, account]
                  : current.filter(value => value !== account)
              )
            }
          />
        ))}
      </div>
    </section>
  )
}

function ControlledExample() {
  const [checked, setChecked] = useState(false)
  return (
    <section className="grid gap-1">
      <p className="text-ui-14 text-ui-secondary">
        These controls share one value.
      </p>
      <CheckboxField
        label="Include archived accounts"
        checked={checked}
        onCheckedChange={setChecked}
      />
      <SwitchField
        label="Show archived accounts"
        checked={checked}
        onCheckedChange={setChecked}
      />
      <output
        aria-label="Shared value"
        className="text-ui-14 text-ui-secondary"
      >
        {checked ? 'On' : 'Off'}
      </output>
    </section>
  )
}

export const Showcase: Story = {
  render: () => (
    <>
      <header className="grid gap-2">
        <h1 className="text-ui-20 font-medium">Checkbox and Switch</h1>
        <p className="text-ui-16 text-ui-secondary">
          Select items with checkboxes. Turn settings on and off with switches.
          Try clicking labels and using Tab and Space.
        </p>
      </header>
      <div className="grid gap-8 sm:grid-cols-2">
        <section className="grid content-start gap-1">
          <h2 className="mb-3 text-ui-16 font-medium">Checkbox</h2>
          <CheckboxField label="Include in budget" />
          <CheckboxField label="Selected" defaultChecked />
          <CheckboxField label="Partly selected" indeterminate readOnly />
          <CheckboxField label="Unavailable" disabled />
          <CheckboxField
            label="Unavailable, selected"
            disabled
            defaultChecked
          />
          <CheckboxField label="Read only" readOnly defaultChecked />
        </section>
        <section className="grid content-start gap-1">
          <h2 className="mb-3 text-ui-16 font-medium">Switch</h2>
          <SwitchField label="Notifications" />
          <SwitchField label="Automatic sync" defaultChecked />
          <SwitchField label="Unavailable" disabled />
          <SwitchField label="Unavailable, enabled" disabled defaultChecked />
          <SwitchField label="Read only" readOnly defaultChecked />
        </section>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="mb-3 text-ui-16 font-medium">Mixed selection</h2>
          <SelectionExample />
        </section>
        <section>
          <h2 className="mb-3 text-ui-16 font-medium">Controlled together</h2>
          <ControlledExample />
        </section>
      </div>
      <section className="max-w-sm">
        <h2 className="mb-3 text-ui-16 font-medium">Long labels</h2>
        <SwitchField label="Notify me when spending reaches the monthly limit for this envelope" />
      </section>
    </>
  ),
}

export const MixedSelection: Story = {
  render: () => <SelectionExample />,
  play: async ({ canvas }) => {
    const all = canvas.getByRole('checkbox', { name: 'All accounts' })
    await expect(all).toBePartiallyChecked()
    await userEvent.click(all)
    for (const control of canvas.getAllByRole('checkbox'))
      await expect(control).toBeChecked()
    await userEvent.keyboard('[Space]')
    for (const control of canvas.getAllByRole('checkbox'))
      await expect(control).not.toBeChecked()
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Cash' }))
    await expect(all).toBePartiallyChecked()
  },
}

export const ControlledAndUncontrolled: Story = {
  render: () => (
    <>
      <ControlledExample />
      <CheckboxField label="Independent checkbox" defaultChecked />
      <SwitchField label="Independent switch" defaultChecked />
    </>
  ),
  play: async ({ canvas }) => {
    const checkbox = canvas.getByRole('checkbox', {
      name: 'Include archived accounts',
    })
    const control = canvas.getByRole('switch', {
      name: 'Show archived accounts',
    })
    await userEvent.click(checkbox)
    await expect(control).toBeChecked()
    await userEvent.click(control)
    await expect(checkbox).not.toBeChecked()
    for (const [role, name] of [
      ['checkbox', 'Independent checkbox'],
      ['switch', 'Independent switch'],
    ]) {
      const independent = canvas.getByRole(role, { name })
      await expect(independent).toBeChecked()
      await userEvent.click(independent)
      await expect(independent).not.toBeChecked()
    }
  },
}

function LabelsExample() {
  const [changes, setChanges] = useState(0)
  return (
    <>
      <CheckboxField
        label="Include account"

        onCheckedChange={() => setChanges(value => value + 1)}
      />
      <SwitchField
        label="Enable sync"

        onCheckedChange={() => setChanges(value => value + 1)}
      />
      <output aria-label="Changes">{changes}</output>
      <CheckboxField label="Disabled checkbox" disabled />
      <SwitchField label="Disabled switch" disabled />
      <CheckboxField label="Read-only checkbox" readOnly defaultChecked />
      <SwitchField label="Read-only switch" readOnly defaultChecked />
      <div className="flex items-center gap-6">
        <label htmlFor="external-checkbox">External checkbox label</label>
        <Checkbox id="external-checkbox" />
      </div>
      <div className="flex items-center gap-6">
        <label htmlFor="external-switch">External switch label</label>
        <Switch id="external-switch" />
      </div>
    </>
  )
}

export const KeyboardAndLabels: Story = {
  render: () => <LabelsExample />,
  play: async ({ canvas }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Include account' })
    const control = canvas.getByRole('switch', { name: 'Enable sync' })
    await userEvent.click(canvas.getByText('Include account', { exact: true }))
    await expect(checkbox).toBeChecked()
    await expect(canvas.getByLabelText('Changes')).toHaveTextContent('1')
    await userEvent.click(canvas.getByText('Enable sync', { exact: true }))
    await expect(control).toBeChecked()
    await expect(canvas.getByLabelText('Changes')).toHaveTextContent('2')
    await userEvent.tab({ shift: true })
    await expect(checkbox).toHaveFocus()
    await userEvent.keyboard('[Space]')
    await expect(checkbox).not.toBeChecked()
    await userEvent.tab()
    await expect(control).toHaveFocus()
    await userEvent.keyboard('[Space]')
    await expect(control).not.toBeChecked()
    await expect(canvas.getByLabelText('Changes')).toHaveTextContent('4')
    await userEvent.tab()
    const readonlyCheckbox = canvas.getByRole('checkbox', {
      name: 'Read-only checkbox',
    })
    await expect(readonlyCheckbox).toHaveFocus()
    await userEvent.keyboard('[Space]')
    await expect(readonlyCheckbox).toBeChecked()
    await userEvent.tab()
    const readonlySwitch = canvas.getByRole('switch', {
      name: 'Read-only switch',
    })
    await expect(readonlySwitch).toHaveFocus()
    await userEvent.keyboard('[Space]')
    await expect(readonlySwitch).toBeChecked()
    for (const [role, name] of [
      ['checkbox', 'External checkbox label'],
      ['switch', 'External switch label'],
    ]) {
      await userEvent.click(canvas.getByText(name))
      await expect(canvas.getByRole(role, { name })).toBeChecked()
    }
  },
}

function FormExample() {
  const [submitted, setSubmitted] = useState('Not submitted')
  return (
    <>
      <form
        aria-label="Preferences"
        onSubmit={event => {
          event.preventDefault()
          setSubmitted(
            JSON.stringify(
              Object.fromEntries(new FormData(event.currentTarget))
            )
          )
        }}
      >
        <CheckboxField
          label="Account included"
          name="included"
          value="yes"
          defaultChecked
        />
        <SwitchField
          label="Sync enabled"
          name="sync"
          value="yes"
          defaultChecked
        />
        <div className="mt-4 flex gap-4">
          <button
            type="submit"
            className="rounded-lg border border-ui-border px-4 py-2"
          >
            Submit
          </button>
        </div>
      </form>
      <output aria-label="Submitted values">{submitted}</output>
    </>
  )
}

export const FormSubmission: Story = {
  render: () => <FormExample />,
  play: async ({ canvas }) => {
    const submit = canvas.getByRole('button', { name: 'Submit' })
    await userEvent.click(submit)
    await expect(canvas.getByLabelText('Submitted values')).toHaveTextContent(
      '{"included":"yes","sync":"yes"}'
    )
    await userEvent.click(
      canvas.getByRole('checkbox', { name: 'Account included' })
    )
    await userEvent.click(canvas.getByRole('switch', { name: 'Sync enabled' }))
    await userEvent.click(submit)
    await expect(canvas.getByLabelText('Submitted values')).toHaveTextContent(
      '{}'
    )
  },
}
