import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { OverlayHost } from '@/6-shared/overlays'
import { Select, MultiSelect } from './Select'

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
})
