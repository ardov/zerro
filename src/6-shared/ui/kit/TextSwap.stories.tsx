import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button } from './Button'
import { TextSwap } from './TextSwap'

const meta = {
  title: 'UI Kit/Building blocks/TextSwap',
  component: TextSwap,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { value: 'EN' },
  render: args => (
    <Button aria-label={args.value}>
      <TextSwap {...args} />
    </Button>
  ),
} satisfies Meta<typeof TextSwap>
export default meta
type Story = StoryObj<typeof meta>

export const Bench: Story = {}

function LanguageButton() {
  const [language, setLanguage] = useState('EN')
  return (
    <Button
      aria-label={`Language: ${language}`}
      onClick={() => setLanguage(value => (value === 'EN' ? 'RU' : 'EN'))}
    >
      <TextSwap value={language} />
    </Button>
  )
}

export const RapidChanges: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LanguageButton />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', {
      name: 'Language: EN',
    })
    expect(button.getAnimations({ subtree: true })).toHaveLength(0)
    for (const next of ['RU', 'EN', 'RU', 'EN', 'RU']) {
      await userEvent.click(button)
      expect(button).toHaveAccessibleName(`Language: ${next}`)
      expect(button.querySelector('.text-swap-current')).toHaveTextContent(next)
      expect(button.querySelector('.text-swap')?.children).toHaveLength(2)
    }
    await waitFor(() =>
      expect(
        button
          .querySelector('.text-swap')!
          .getAnimations({ subtree: true })
          .some(animation => animation.playState === 'running')
      ).toBe(false)
    )
    expect(button.querySelector('.text-swap-current')).toBeVisible()
    expect(button.querySelector('.text-swap-outgoing')).not.toBeVisible()
  },
}

function BusyPageButton() {
  const [period, setPeriod] = useState('for the year')
  return (
    <Button
      aria-label={period}
      onClick={() => {
        // A frame is already due, as a pressed state makes it, and the rest
        // of a heavy page then renders in the same update.
        requestAnimationFrame(() => {})
        const until = performance.now() + 200
        while (performance.now() < until);
        setPeriod(value =>
          value === 'for the year' ? 'for three years' : 'for the year'
        )
      }}
    >
      <TextSwap value={period} />
    </Button>
  )
}

/** A long render in the same update must not play the swap out unseen. */
export const AfterLongRender: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <BusyPageButton />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button')
    const frame = () => new Promise(resolve => requestAnimationFrame(resolve))
    await userEvent.click(button)
    await frame()
    await frame()
    await frame()
    const animations = button.getAnimations({ subtree: true })
    // Both layers and, outside reduced motion, the width.
    expect(animations.length).toBeGreaterThanOrEqual(2)
    for (const animation of animations) {
      expect(animation.playState).toBe('running')
      expect(Number(animation.currentTime)).toBeLessThan(100)
    }
  },
}
