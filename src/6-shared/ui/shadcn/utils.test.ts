import { expect, it } from 'vitest'
import { cn } from './utils'

it('lets callers override kit radii while retaining corner smoothing', () => {
  expect(
    cn(
      'rounded-ui-control rounded-smooth',
      'rounded-ui-control-inner',
      'rounded-full'
    )
  ).toBe('rounded-smooth rounded-full')
  expect(cn('rounded-ui-control', 'rounded-[50%]')).toBe('rounded-[50%]')
  expect(cn('rounded-ui-control', 'rounded-t-sm')).toBe(
    'rounded-ui-control rounded-t-sm'
  )
})
