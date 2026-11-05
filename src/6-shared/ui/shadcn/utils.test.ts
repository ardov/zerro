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

it('lets callers remove kit shadows without discarding shadow colors', () => {
  expect(cn('shadow-ui-popover', 'shadow-none')).toBe('shadow-none')
  expect(cn('shadow-ui-card', 'shadow-ui-popover')).toBe('shadow-ui-popover')
  expect(cn('shadow-none', 'shadow-ui-popover')).toBe('shadow-ui-popover')
  expect(cn('shadow-ui-popover shadow-black/10', 'shadow-none')).toBe(
    'shadow-black/10 shadow-none'
  )
})

it.each([
  'body',
  'body-sm',
  'caption',
  'overline',
  'title',
  'title-lg',
  'display',
  'ui-14',
])('keeps the %s font size independent of text color', size => {
  expect(cn(`text-${size}`, 'text-ui-secondary')).toBe(
    `text-${size} text-ui-secondary`
  )
  expect(cn('text-ui-secondary', `text-${size}`)).toBe(
    `text-ui-secondary text-${size}`
  )
  expect(cn(`text-${size} text-ui-secondary`, 'text-lg text-ui-error')).toBe(
    'text-lg text-ui-error'
  )
  expect(cn('text-lg text-ui-error', `text-${size}`)).toBe(
    `text-ui-error text-${size}`
  )
})
