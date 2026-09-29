import '@testing-library/jest-dom'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Favicon } from './Favicon'

const fallback = <span data-testid="fallback">fallback</span>

function favicon(container: HTMLElement) {
  const image = container.querySelector('img')
  if (!image) throw new Error('Expected favicon image')
  return image
}

describe('Favicon', () => {
  it('keeps the fallback without requesting an image when no domain exists', () => {
    const view = render(<Favicon fallback={fallback} />)
    expect(view.container.querySelector('img')).toBeNull()
    expect(view.getByTestId('fallback')).toBeVisible()
  })

  it('tries 48px, then 32px, then keeps the fallback', () => {
    const view = render(<Favicon domain="amazon.com" fallback={fallback} />)

    expect(favicon(view.container).src).toContain('amazon.com&sz=48')
    expect(view.getByTestId('fallback')).toBeVisible()

    fireEvent.error(favicon(view.container))
    expect(favicon(view.container).src).toContain('amazon.com&sz=32')

    fireEvent.error(favicon(view.container))
    expect(view.container.querySelector('img')).toBeNull()
    expect(view.getByTestId('fallback')).toBeVisible()
  })

  it('shows the favicon only after it loads and retries for a new domain', () => {
    const view = render(<Favicon domain="amazon.com" fallback={fallback} />)

    fireEvent.load(favicon(view.container))
    expect(view.getByTestId('fallback').parentElement).toHaveClass('opacity-0')

    view.rerender(<Favicon domain="paypal.com" fallback={fallback} />)
    expect(favicon(view.container).src).toContain('paypal.com&sz=48')
    expect(view.getByTestId('fallback')).toBeVisible()
  })
})
