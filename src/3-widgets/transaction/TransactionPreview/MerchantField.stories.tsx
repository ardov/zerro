import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { core } from '@/zerro-core/redux'
import type { TNamedMerchant } from './draft'
import {
  expect,
  within,
  userEvent,
  waitFor,
  fireEvent,
  fn,
} from 'storybook/test'
import { MerchantField } from './MerchantField'

const meta = {
  title: 'App/Transactions/MerchantField',
  component: MerchantField,
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo', route: '/budget' },
  },
} satisfies Meta<typeof MerchantField>

export default meta
type Story = StoryObj<typeof meta>

/** A bare payee has not yet been made into a merchant. */
export const BarePayee: Story = {
  args: {
    merchant: null,
    payee: 'Temporary place',
    originalPayee: null,
    debt: false,
    placeholder: 'Place',
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const payee = within(canvasElement).getByText('Temporary place')
    expect(getComputedStyle(payee).fontStyle).toBe('italic')
    await waitFor(() =>
      expect(
        Array.from(document.fonts).some(
          face =>
            face.family.includes('IBM Plex Sans') &&
            face.style === 'italic' &&
            face.weight === '400'
        )
      ).toBe(true)
    )
  },
}

function PickerHarness() {
  const navigate = useNavigate()
  const [merchant, setMerchant] = useState<TNamedMerchant | null>(null)
  const first = Object.values(core.merchants.useAll())[0]
  return (
    <>
      <MerchantField
        merchant={merchant}
        onChange={setMerchant}
        payee={null}
        originalPayee={null}
        debt={false}
        placeholder="Place"
      />
      <output data-testid="chosen">
        {merchant ? JSON.stringify(merchant) : 'none'}
      </output>
      <button data-testid="history-back" onClick={() => navigate(-1)}>
        History Back
      </button>
      <output data-testid="first-name">{first?.title}</output>
    </>
  )
}

export const SearchAndCreate: Story = {
  args: BarePayee.args,
  render: () => <PickerHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)
    const trigger = canvas.getByRole('combobox', { name: /^Place/ })
    const firstName = canvas.getByTestId('first-name').textContent!
    await userEvent.click(trigger)
    let input = await body.findByRole('combobox', { name: 'Find or create' })
    const showAll = body.queryByRole('button', { name: 'Show all' })
    if (showAll) {
      const count = body.getAllByRole('option').length
      await userEvent.click(showAll)
      await expect(input).toHaveFocus()
      await expect(body.getAllByRole('option').length).toBeGreaterThan(count)
      await expect(canvas.getByTestId('chosen')).toHaveTextContent('none')
    }
    await userEvent.type(input, firstName.slice(0, -1))
    const matches = within(await body.findByRole('listbox')).getAllByRole(
      'option'
    )
    const matchedName = matches[0].textContent!.trim()
    await expect(matchedName).not.toMatch(/^Create /)
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant'))
    await userEvent.keyboard('{Enter}')
    await waitFor(() =>
      expect(canvas.getByTestId('chosen')).toHaveTextContent(matchedName)
    )
    await waitFor(() => expect(trigger).toHaveFocus())
    await userEvent.click(trigger)
    input = await body.findByRole('combobox', { name: 'Find or create' })
    await userEvent.type(input, 'Unique new merchant 987')
    await expect(body.getAllByRole('option')).toHaveLength(1)
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant'))
    fireEvent.keyDown(input, {
      key: 'Enter',
      keyCode: 229,
      which: 229,
      isComposing: true,
    })
    await expect(canvas.getByTestId('chosen')).toHaveTextContent(matchedName)
    await expect(input).toBeVisible()
    await userEvent.keyboard('{Enter}')
    await waitFor(() =>
      expect(canvas.getByTestId('chosen')).toHaveTextContent(
        'Unique new merchant 987'
      )
    )
    await waitFor(() => expect(trigger).toHaveFocus())
    await userEvent.click(trigger)
    input = await body.findByRole('combobox', { name: 'Find or create' })
    fireEvent.click(canvas.getByTestId('history-back'))
    await waitFor(() => expect(input).not.toBeInTheDocument())
    await expect(canvas.getByTestId('chosen')).toHaveTextContent(
      'Unique new merchant 987'
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Leave empty' }))
    await waitFor(() =>
      expect(canvas.getByTestId('chosen')).toHaveTextContent('none')
    )
    await expect(body.queryByRole('listbox')).not.toBeInTheDocument()
  },
}

export const CreateWithArrowKeys: Story = {
  args: BarePayee.args,
  render: () => <PickerHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)
    const name = canvas.getByTestId('first-name').textContent!
    const trigger = canvas.getByRole('combobox', { name: /^Place/ })
    await userEvent.click(trigger)
    const input = await body.findByRole('combobox', { name: 'Find or create' })
    await userEvent.type(input, name)
    await expect(body.queryByRole('option', { name: /^Create / })).toBeNull()
    await userEvent.clear(input)
    await userEvent.type(input, name.slice(0, -1))
    const create = await body.findByRole('option', { name: /^Create / })
    const options = body.getAllByRole('option')
    await expect(options.length).toBeGreaterThan(1)
    // The first match is already active; arrows can reach the final create choice.
    for (let i = 1; i < options.length; i++)
      await userEvent.keyboard('{ArrowDown}')
    await expect(input).toHaveAttribute('aria-activedescendant', create.id)
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByTestId('chosen')).toHaveTextContent(
      JSON.stringify({ title: name.slice(0, -1) })
    )
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

export const LegacySearch: Story = {
  ...BarePayee,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)
    const trigger = canvas.getByRole('combobox', { name: /^Place/ })
    await userEvent.click(trigger)
    const input = await body.findByRole('combobox', { name: 'Find or create' })
    await expect(input).toHaveValue('Temporary place')
    await userEvent.clear(input)
    await userEvent.type(input, 'Another search')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(input).not.toBeInTheDocument())
    await userEvent.click(trigger)
    await expect(
      await body.findByRole('combobox', { name: 'Find or create' })
    ).toHaveValue('Temporary place')
    await userEvent.keyboard('{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith({
      title: 'Temporary place',
    })
    await waitFor(() => expect(body.queryByRole('listbox')).toBeNull())
  },
}

export const MobileSearchAndCreate: Story = {
  ...SearchAndCreate,
  globals: { viewport: { value: 'mobile1' } },
}
