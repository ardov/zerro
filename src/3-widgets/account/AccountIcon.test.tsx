import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { bankIconById } from '@/6-shared/zenmoney-assets/bankIcons'
import { AccountIcon } from './AccountIcon'

afterEach(cleanup)

it('uses the account company ID without requiring a company directory', () => {
  const { container } = render(
    <AccountIcon account={{ company: 12574, type: 'ccard' }} />
  )
  const image = container.querySelector('img')!
  expect(image).toHaveAttribute('src', bankIconById[12574])
  expect(image).toHaveAttribute('alt', '')
  expect(image).toHaveAttribute('aria-hidden', 'true')
})

it.each([null, -1])('falls back for an unmapped company %s', company => {
  const { container } = render(
    <AccountIcon account={{ company, type: 'cash' }} />
  )
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

it('falls back after an image failure and tries a different company', () => {
  const { container, rerender } = render(
    <AccountIcon account={{ company: 12574, type: 'ccard' }} />
  )
  fireEvent.error(container.querySelector('img')!)
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('svg')).not.toBeNull()
  rerender(<AccountIcon account={{ company: 4417, type: 'ccard' }} />)
  expect(container.querySelector('img')).toHaveAttribute(
    'src',
    bankIconById[4417]
  )
})
