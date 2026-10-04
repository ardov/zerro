import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useAsk } from '@/6-shared/overlays'
import { Button } from '@/6-shared/ui/kit/Button'
import { RenamePopover } from './RenamePopover'

function Demo() {
  const ask = useAsk()
  const nameRef = useRef<HTMLHeadingElement>(null)
  const [name, setName] = useState('Groceries')
  const [answer, setAnswer] = useState('none')
  return (
    <div className="grid justify-items-start gap-4">
      <h2 ref={nameRef} className="m-0 text-title font-sans font-black">
        {name}
      </h2>
      <Button
        onClick={async () => {
          setAnswer('pending')
          const next = await ask<string>(
            <RenamePopover value={name} anchor={nameRef.current} />
          )
          setAnswer(next ?? 'unchanged')
          if (next !== undefined) setName(next)
        }}
      >
        Rename
      </Button>
      <output aria-label="Answer">{answer}</output>
    </div>
  )
}

const meta = {
  title: 'App/Budgets/RenamePopover',
  render: () => <Demo />,
  parameters: { layout: 'centered', historyShortcuts: true },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

const check: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  const trigger = canvas.getByRole('button', { name: 'Rename' })
  const answer = canvas.getByLabelText('Answer')
  const heading = canvas.getByRole('heading')
  const rename = async (draft: string | null, close: string) => {
    await userEvent.click(trigger)
    const field = await body.findByRole('textbox', { name: 'Rename' })
    await waitFor(() => expect(field).toHaveFocus())
    // The field's text covers the name's text: same place, same type.
    await waitFor(() => {
      const from = heading.getBoundingClientRect()
      const to = field.getBoundingClientRect()
      expect(Math.abs(to.left - from.left)).toBeLessThan(1)
      expect(Math.abs(to.top - from.top)).toBeLessThan(1)
    })
    const fieldFont = getComputedStyle(field)
    const nameFont = getComputedStyle(heading)
    await expect(fieldFont.fontSize).toBe(nameFont.fontSize)
    await expect(fieldFont.fontWeight).toBe(nameFont.fontWeight)
    await expect(fieldFont.lineHeight).toBe(nameFont.lineHeight)
    if (draft !== null) {
      await userEvent.clear(field)
      await userEvent.type(field, draft)
    }
    await userEvent.keyboard(close)
    await waitFor(() =>
      expect(body.queryByRole('textbox', { name: 'Rename' })).toBeNull()
    )
    await waitFor(() => expect(trigger).toHaveFocus())
  }

  // Enter without a change answers nothing.
  await rename(null, '{Enter}')
  await expect(answer).toHaveTextContent('unchanged')
  // Enter answers the changed draft.
  await rename('Food', '{Enter}')
  await expect(answer).toHaveTextContent('Food')
  // Escape keeps a changed draft.
  await rename('Market', '{Escape}')
  await expect(answer).toHaveTextContent('Market')
  // So does Back, which closes the popover rather than leaving the page.
  await rename('Bazaar', '{Alt>}{ArrowLeft}{/Alt}')
  await expect(answer).toHaveTextContent('Bazaar')
  await expect(heading).toHaveTextContent('Bazaar')
}

export const Desktop: Story = {
  globals: { viewport: { value: 'zerro500' } },
  play: check,
}
export const Mobile: Story = {
  globals: { viewport: { value: 'zerro499' } },
  play: check,
}
