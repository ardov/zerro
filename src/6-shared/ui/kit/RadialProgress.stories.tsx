import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { RadialProgress } from './RadialProgress'

const meta = {
  title: 'UI Kit/Feedback/RadialProgress',
  component: RadialProgress,
  tags: ['autodocs'],
  args: { size: 64, value: 0.55, 'aria-label': 'Progress' },
  parameters: {
    docs: {
      description: {
        component:
          'A radial indicator for goals and ongoing work. Pass value from 0 to 1 for known progress; omit value for indeterminate loading. active adds a moving orbit to known progress. Supply an accessible label for standalone indicators; unlabeled indicators are decorative.',
      },
    },
  },
} satisfies Meta<typeof RadialProgress>

export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('progressbar')
    ).toHaveAttribute('aria-valuenow', '0.55')
  },
}

export const Loading: Story = {
  args: { value: undefined, size: 40, 'aria-label': 'Loading' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('progressbar', { name: 'Loading' })
    ).not.toHaveAttribute('aria-valuenow')
    await expect(spinning(canvasElement)).toBe(motionAllowed())
  },
}

export const Complete: Story = {
  args: { value: 1 },
  play: async ({ canvasElement }) => {
    await expect(spinning(canvasElement)).toBe(false)
  },
}

export const Active: Story = {
  args: { active: true },
  play: async ({ canvasElement }) => {
    await expect(spinning(canvasElement)).toBe(motionAllowed())
  },
}

/** A goal ring repeated down the budget table must not animate at rest. */
export const StaticRing: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: 0.55, size: 16, 'aria-label': undefined },
  play: async ({ canvasElement }) => {
    await expect(spinning(canvasElement)).toBe(false)
  },
}

function StoppingRing() {
  const [active, setActive] = useState(true)
  return (
    <>
      <RadialProgress value={0.55} size={64} active={active} />
      <button type="button" onClick={() => setActive(false)}>
        Stop
      </button>
    </>
  )
}

/** A ring that stops holds its angle while its dashes close up. */
export const StoppingKeepsAngle: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <StoppingRing />,
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    await userEvent.click(within(canvasElement).getByRole('button'))
    const orbit = canvasElement
      .querySelector('svg')!
      .getAnimations({ subtree: true })
      .filter(animation => animation instanceof CSSAnimation)
    if (!motionAllowed()) {
      await expect(orbit).toHaveLength(0)
      return
    }
    await expect(orbit).toHaveLength(1)
    await expect(orbit[0].playState).toBe('paused')
    await expect(Number(orbit[0].currentTime)).toBeGreaterThan(0)
  },
}

/** A moving indicator spins unless the reader asked for reduced motion. */
function motionAllowed() {
  return !matchMedia('(prefers-reduced-motion: reduce)').matches
}

function spinning(canvasElement: HTMLElement) {
  return canvasElement
    .querySelector('svg')!
    .getAnimations({ subtree: true })
    .some(animation => animation.playState === 'running')
}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => (
    <div className="flex gap-4">
      <RadialProgress size={40} />
      <RadialProgress size={24} />
      <RadialProgress value={0} size={64} />
      <RadialProgress value={0.55} size={64} />
      <RadialProgress value={0.55} size={64} active />
      <RadialProgress value={1} size={64} />
    </div>
  ),
}
