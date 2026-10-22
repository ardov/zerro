import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { CalendarIcon } from '@/6-shared/ui/Icons'
import { Chip } from './Chip'
import { TagIcon } from '../TagIcon'
import { CategoryIcon } from '../CategoryIcon'

const meta = {
  tags: ['autodocs'],
  title: 'UI Kit/Data display/Chip',
  component: Chip,
  parameters: {
    controls: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Compact category labels and filters. Use children for the label and start for a decorative icon. color accepts an opaque HEX, RGB or OKLCH fill; outline variants ignore it. size="sm" is 24px; the default size="md" is 32px. checked + onClick makes a controlled toggle: checked owns filled/outline styling and aria-pressed. Without checked, onClick opens or edits; onRemove removes. Interactive chips have one Tab stop; Delete/Backspace removes. className/style decorate the surface; native attributes and ref target the primary button (the label span when static). The caller restores focus after removing a chip. Example: <Chip onRemove={remove}>Groceries</Chip>.',
      },
    },
  },
  args: { children: 'Groceries' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['filled', 'outline', 'outline-draft'],
    },
    color: { control: 'color' },
  },
} satisfies Meta<typeof Chip>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const FadeLabels: Story = {
  render: () => (
    <div className="flex w-48 flex-col gap-3">
      <Chip onClick={fn()} onRemove={fn()}>
        Short label
      </Chip>
      <Chip start={<CalendarIcon />} onClick={fn()} onRemove={fn()}>
        A long label that fades before the removal action
      </Chip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const short = canvas.getByRole('button', { name: 'Short label' })
    const long = canvas.getByRole('button', {
      name: 'A long label that fades before the removal action',
    })
    // Overflow is measured when the first frame lays out.
    await waitFor(() =>
      expect(long.querySelector('[data-overflow]')).not.toBeNull()
    )
    await expect(short.querySelector('[data-overflow]')).toBeNull()
    await expect(
      canvas.getByRole('button', {
        name: 'Remove A long label that fades before the removal action',
      })
    ).toBeVisible()
  },
}
export const Showcase: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-6 p-8">
      {(['filled', 'outline', 'outline-draft'] as const).map(variant => (
        <div key={variant} className="flex flex-wrap gap-3">
          <Chip variant={variant}>Groceries</Chip>
          <Chip variant={variant} start={<CalendarIcon />} onClick={fn()}>
            Category
          </Chip>
          <Chip variant={variant} onRemove={fn()}>
            Selected
          </Chip>
          <Chip
            variant={variant}
            start={<CalendarIcon />}
            onClick={fn()}
            onRemove={fn()}
          >
            Filter
          </Chip>
          <Chip variant={variant} onClick={fn()} onRemove={fn()} disabled>
            Disabled
          </Chip>
        </div>
      ))}
      <div className="flex flex-wrap gap-3">
        {['#f5dd72', '#172554', '#de6474', 'oklch(0.600 0.150 150)'].map(
          color => (
            <Chip
              key={color}
              color={color}
              start={<CalendarIcon />}
              onClick={fn()}
              onRemove={fn()}
            >
              Groceries
            </Chip>
          )
        )}
      </div>
      <Chip
        className="max-w-48"
        start={<CalendarIcon />}
        onClick={fn()}
        onRemove={fn()}
      >
        A long category name that does not fit
      </Chip>
    </div>
  ),
}
export const Interaction: Story = {
  args: { onClick: fn(), onRemove: fn() },
  render: args => (
    <div className="flex gap-3">
      <Chip {...args} />
      <button type="button">Next</button>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const primary = canvas.getByRole('button', {
      name: 'Groceries',
    })
    primary.focus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onClick).toHaveBeenCalledTimes(1)
    await userEvent.keyboard('{Delete}')
    await expect(args.onRemove).toHaveBeenCalledTimes(1)
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Next' })).toHaveFocus()
    await userEvent.click(canvas.getAllByRole('button')[1])
    await expect(args.onRemove).toHaveBeenCalledTimes(2)
    await expect(args.onClick).toHaveBeenCalledTimes(1)
  },
}

function ToggleChips() {
  const [checked, setChecked] = useState(false)
  return (
    <div className="flex items-center gap-3">
      <Chip
        size="sm"
        checked={checked}
        onClick={() => setChecked(value => !value)}
      >
        Income
      </Chip>
      <Chip checked={!checked} onClick={() => setChecked(value => !value)}>
        Expenses
      </Chip>
      <Chip size="sm" checked disabled onClick={() => setChecked(false)}>
        Disabled
      </Chip>
    </div>
  )
}

export const Toggle: Story = {
  render: () => <ToggleChips />,
  play: async ({ canvas }) => {
    const income = canvas.getByRole('button', {
      name: 'Income',
      pressed: false,
    })
    await expect(
      income.closest('[data-slot="chip"]')!.getBoundingClientRect().height
    ).toBe(24)
    await expect(
      canvas
        .getByRole('button', { name: 'Expenses' })
        .closest('[data-slot="chip"]')!
        .getBoundingClientRect().height
    ).toBe(32)
    await userEvent.click(income)
    await expect(income).toHaveAttribute('aria-pressed', 'true')
    await userEvent.keyboard('[Space]')
    await expect(income).toHaveAttribute('aria-pressed', 'false')
    await userEvent.keyboard('{Enter}')
    await expect(income).toHaveAttribute('aria-pressed', 'true')
    const disabled = canvas.getByRole('button', { name: 'Disabled' })
    await expect(disabled).toBeDisabled()
    await userEvent.click(disabled)
    await expect(income).toHaveAttribute('aria-pressed', 'true')
  },
}

export const Compact: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Chip size="sm">USD</Chip>
      <Chip size="sm" variant="outline">
        Current
      </Chip>
      <Chip size="sm" start={<CalendarIcon />} onClick={fn()}>
        Date
      </Chip>
      <Chip size="sm" onRemove={fn()}>
        Category
      </Chip>
      <Chip size="sm" start={<CalendarIcon />} onClick={fn()} onRemove={fn()}>
        Filter
      </Chip>
    </div>
  ),
}

export const ColoredSurfaces: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-8">
      {['#f5dd72', '#172554', '#777777', 'oklch(0.6 0.15 150)'].map(color => (
        <div key={color} className="flex items-center gap-3">
          <Chip color={color} onClick={fn()} onRemove={fn()}>
            Interactive
          </Chip>
          <Chip color={color}>Static</Chip>
          <Chip color={color} disabled onClick={fn()}>
            Disabled
          </Chip>
          <TagIcon color={color} symbol="🍎" button />
          <CategoryIcon color={color} symbol="🍎" />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const surfaces =
      canvasElement.querySelectorAll<HTMLElement>('.colored-surface')
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const surface of surfaces) {
      const resting = getComputedStyle(surface).backgroundImage
      await expect(resting).toContain('linear-gradient')
      await expect(resting).toContain('oklch')
      // Drive the same registered value as hover, then sample the midpoint.
      // This catches an unregistered property snapping between gradient stops.
      surface.style.setProperty('--surface-shift', '10')
      getComputedStyle(surface).getPropertyValue('--surface-shift')
      const transition = surface
        .getAnimations()
        .find(
          animation =>
            animation instanceof CSSTransition &&
            animation.transitionProperty === '--surface-shift'
        )
      if (reduced) {
        await expect(transition).toBeUndefined()
      } else {
        await expect(transition).toBeDefined()
        await expect(transition!.effect!.getTiming().duration).toBe(150)
        transition!.pause()
        const duration = Number(transition!.effect!.getTiming().duration)
        transition!.currentTime = duration / 2
        const midway = Number(
          getComputedStyle(surface).getPropertyValue('--surface-shift')
        )
        await expect(midway).toBeGreaterThan(0)
        await expect(midway).toBeLessThan(10)
        await expect(getComputedStyle(surface).backgroundImage).not.toBe(
          resting
        )
        transition!.finish()
      }
      surface.style.removeProperty('--surface-shift')
    }
  },
}
