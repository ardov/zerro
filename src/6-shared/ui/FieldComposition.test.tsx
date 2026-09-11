import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { OverlayHost } from '@/6-shared/overlays'
import { Select, MultiSelect } from './Select'
import { MultiCombobox } from './MultiCombobox'
import { FilledButton, FilledField, FilledInput } from './FilledField'
import { AutoWidthInput } from './AutoWidthInput'

afterEach(cleanup)
const options = [{ value: 'EUR', label: 'Euro' }]
const noop = () => {}
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <OverlayHost>{children}</OverlayHost>
  </MemoryRouter>
)

describe('outlined selection field composition', () => {
  it('connects value, label, error and description to the select and updates external state', () => {
    const props = { label: 'Currency', options, onChange: noop }
    const view = render(
      <Select
        {...props}
        value="EUR"
        error
        helperText="Choose another currency"
      />,
      { wrapper }
    )
    const control = screen.getByRole('combobox', { name: 'Currency' })
    expect(control).toHaveAttribute('aria-invalid', 'true')
    expect(control).toHaveAccessibleDescription('Choose another currency')
    expect(control.closest('[data-size]')).toHaveAttribute('data-filled')
    view.rerender(<Select {...props} value="" disabled helperText="Locked" />)
    expect(control).not.toHaveAttribute('aria-invalid', 'true')
    expect(control).toBeDisabled()
    expect(control).toHaveAccessibleDescription('Locked')
    expect(control.closest('[data-size]')).not.toHaveAttribute('data-filled')
  })

  it('keeps an empty multiple summary floated without claiming a selected value', () => {
    render(
      <MultiSelect
        label="Tags"
        value={[]}
        options={options}
        onChange={noop}
        renderValue={value => `${value.length} selected`}
        error
        helperText="Choose tags"
      />,
      { wrapper }
    )
    const control = screen.getByRole('combobox', { name: 'Tags' })
    expect(control).toHaveTextContent('0 selected')
    expect(control).toHaveAttribute('aria-invalid', 'true')
    expect(control).toHaveAccessibleDescription('Choose tags')
    expect(control.closest('[data-size]')).toHaveAttribute('data-shrink')
    expect(control.closest('[data-size]')).not.toHaveAttribute('data-filled')
  })

  it('reports combobox selections to its field even while the search text is empty', () => {
    const props = {
      label: 'Accounts',
      options,
      onChange: noop,
      open: false,
      onOpenChange: noop,
    }
    const view = render(<MultiCombobox {...props} value={['EUR']} />)
    const input = screen.getByRole('combobox', { name: 'Accounts' })
    expect(input.closest('[data-size]')).toHaveAttribute('data-filled')
    view.rerender(<MultiCombobox {...props} value={[]} />)
    expect(input.closest('[data-size]')).not.toHaveAttribute('data-filled')
  })
})

describe('filled field accessibility', () => {
  it.each([false, true])(
    'connects external errors to the input (multiline=%s)',
    multiline => {
      const view = render(
        <FilledInput
          aria-label="Comment"
          multiline={multiline}
          invalid
          error="Required"
        />
      )
      const input = screen.getByRole('textbox', { name: 'Comment' })
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAccessibleDescription('Required')
      view.rerender(
        <FilledInput aria-label="Comment" multiline={multiline} readOnly />
      )
      expect(input).not.toHaveAttribute('aria-invalid', 'true')
      expect(input).not.toHaveAccessibleDescription()
      expect(input).toHaveAttribute('readonly')
      view.rerender(
        <FilledInput aria-label="Comment" multiline={multiline} disabled />
      )
      expect(input).toBeDisabled()
    }
  )

  it('connects an amount control inside the generic frame', () => {
    render(
      <FilledField invalid error="Invalid amount" disabled>
        <AutoWidthInput aria-label="Amount" value="12" onChange={noop} />
      </FilledField>
    )
    const input = screen.getByRole('textbox', { name: 'Amount' })
    // Disabled controls do not participate in validation, but retain their description.
    expect(input).toBeDisabled()
    expect(input).toHaveAccessibleDescription('Invalid amount')
  })

  it('merges a picker error with an existing description and removes only the error', () => {
    const view = render(
      <>
        <p id="hint">Account picker</p>
        <FilledButton aria-describedby="hint" invalid error="Choose an account">
          Account
        </FilledButton>
      </>
    )
    const button = screen.getByRole('button', { name: 'Account' })
    expect(button).toHaveAttribute('aria-invalid', 'true')
    expect(button).toHaveAccessibleDescription(
      'Account picker Choose an account'
    )
    view.rerender(
      <>
        <p id="hint">Account picker</p>
        <FilledButton aria-describedby="hint">Account</FilledButton>
      </>
    )
    expect(button).not.toHaveAttribute('aria-invalid', 'true')
    expect(button).toHaveAccessibleDescription('Account picker')
  })
})
