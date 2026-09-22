import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { OverlayHost } from '@/6-shared/overlays'
import { Calendar } from './Calendar'

afterEach(cleanup)

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <OverlayHost>{children}</OverlayHost>
  </MemoryRouter>
)

it('starts empty and emits a local calendar date without clearing on a repeated click', () => {
  const onChange = vi.fn()
  const view = render(
    <Calendar value={null} defaultMonth="2026-02-01" onChange={onChange} />,
    { wrapper }
  )
  expect(screen.getAllByRole('gridcell')).toHaveLength(42)
  expect(view.container.querySelector('[aria-selected="true"]')).toBeNull()
  const button = view.container.querySelector<HTMLButtonElement>(
    '[data-day="2026-02-15"] button'
  )!
  fireEvent.click(button)
  expect(onChange).toHaveBeenLastCalledWith('2026-02-15')
  view.rerender(<Calendar value="2026-02-15" onChange={onChange} />)
  fireEvent.click(button)
  expect(onChange).toHaveBeenLastCalledWith('2026-02-15')
})

it('reveals an externally changed selection and keeps its month when cleared', () => {
  const onChange = vi.fn()
  const view = render(<Calendar value="2026-02-15" onChange={onChange} />, {
    wrapper,
  })
  view.rerender(<Calendar value="2027-08-20" onChange={onChange} />)
  expect(screen.getByRole('grid', { name: 'August 2027' })).toBeInTheDocument()
  view.rerender(<Calendar value={null} onChange={onChange} />)
  expect(screen.getByRole('grid', { name: 'August 2027' })).toBeInTheDocument()
  expect(onChange).not.toHaveBeenCalled()
})
