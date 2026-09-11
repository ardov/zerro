import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { core } from '@/zerro-core/redux'
import type { TNamedMerchant } from './draft'
import { expect, within, userEvent, waitFor, fireEvent } from 'storybook/test'
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
    onChange: () => {},
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
    const trigger = canvas.getByRole('combobox', { name: 'Place' })
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
    await userEvent.click(trigger)
    await userEvent.click(
      await body.findByRole('option', { name: 'Leave empty' })
    )
    await waitFor(() =>
      expect(canvas.getByTestId('chosen')).toHaveTextContent('none')
    )
  },
}
