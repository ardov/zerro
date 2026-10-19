import { useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { TextFade } from './TextFade'
import { ListRowText } from '../ListRow'

const meta = {
  title: 'UI Kit/Data display/TextFade',
  component: TextFade,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TextFade>
export default meta
type Story = StoryObj<typeof meta>

const label = 'A long label that must fade when its container becomes narrow'

function ResizingLabel() {
  const [wide, setWide] = useState(false)
  const [short, setShort] = useState(false)
  const ref = useRef<HTMLHeadingElement>(null)
  return (
    <>
      <div
        style={{ width: wide ? 900 : 180 }}
        className="flex items-center gap-2"
      >
        <TextFade render={<h2 />} ref={ref} className="m-0 text-body">
          {short ? 'Short' : label}
        </TextFade>
        <button type="button">Action</button>
      </div>
      <button type="button" onClick={() => setWide(value => !value)}>
        Resize
      </button>
      <button type="button" onClick={() => setShort(value => !value)}>
        Change text
      </button>
      <button
        type="button"
        onClick={() => {
          if (ref.current) ref.current.dataset.refChecked = 'true'
        }}
      >
        Check ref
      </button>
    </>
  )
}

export const Overflow: Story = {
  render: () => <ResizingLabel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const heading = canvas.getByRole('heading', { name: label })
    const masked = () => getComputedStyle(heading).maskImage !== 'none'
    await waitFor(() => expect(masked()).toBe(true))
    await expect(
      getComputedStyle(canvas.getByRole('button', { name: 'Action' })).maskImage
    ).toBe('none')
    await userEvent.click(canvas.getByRole('button', { name: 'Check ref' }))
    await expect(heading).toHaveAttribute('data-ref-checked', 'true')
    await userEvent.click(canvas.getByRole('button', { name: 'Resize' }))
    await waitFor(() => expect(masked()).toBe(false))
    await userEvent.click(canvas.getByRole('button', { name: 'Resize' }))
    await waitFor(() => expect(masked()).toBe(true))
    await userEvent.click(canvas.getByRole('button', { name: 'Change text' }))
    await waitFor(() => expect(masked()).toBe(false))
  },
}

export const InheritedWrapping: Story = {
  render: () => (
    <div className="w-40">
      <div className="whitespace-nowrap" data-testid="single">
        <ListRowText secondary={label}>Single line</ListRowText>
      </div>
      <div className="whitespace-normal" data-testid="wrapped">
        <ListRowText secondary={label}>Wrapping</ListRowText>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const single = within(canvas.getByTestId('single')).getByText(label)
    const wrapped = within(canvas.getByTestId('wrapped')).getByText(label)
    await waitFor(() =>
      expect(getComputedStyle(single).maskImage).not.toBe('none')
    )
    await expect(getComputedStyle(wrapped).maskImage).toBe('none')
    await expect(wrapped.getBoundingClientRect().height).toBeGreaterThan(
      single.getBoundingClientRect().height
    )
  },
}

/** Keep the exact typography classes used by the budget table. */
export const BudgetTypography: Story = {
  render: () => (
    <div className="grid gap-2 text-ui-16 font-semibold">
      {[
        'text-overline uppercase text-ui-secondary',
        'text-caption font-sans leading-[1.2] text-ui-secondary',
        'text-body-sm font-sans text-ui-error',
        'text-body text-ui-tertiary',
        'text-title font-sans font-black',
      ].map((className, index) => (
        <div key={className} data-testid={`typography-${index}`}>
          <span className={className}>Original</span>
          <TextFade className={className}>With fade</TextFade>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (let index = 0; index < 5; index++) {
      const row = within(canvas.getByTestId(`typography-${index}`))
      const original = getComputedStyle(row.getByText('Original'))
      const faded = getComputedStyle(row.getByText('With fade'))
      for (const property of [
        'fontSize',
        'fontFamily',
        'fontWeight',
        'lineHeight',
        'color',
      ] as const) {
        expect(faded[property], `${index}: ${property}`).toBe(
          original[property]
        )
      }
    }
  },
}

function UpdatingAmount({ ref }: { ref: Ref<{ toggle: () => void }> }) {
  const [long, setLong] = useState(false)
  useImperativeHandle(
    ref,
    () => ({ toggle: () => setLong(value => !value) }),
    []
  )
  return <span>{long ? '123 456 789 000' : '12'}</span>
}

function IndependentChildExample() {
  const amount = useRef<{ toggle: () => void }>(null)
  return (
    <>
      <TextFade className="w-24 text-body" data-testid="amount">
        <UpdatingAmount ref={amount} />
      </TextFade>
      <button type="button" onClick={() => amount.current?.toggle()}>
        Change amount
      </button>
    </>
  )
}

export const IndependentChildUpdate: Story = {
  render: () => <IndependentChildExample />,
  play: async ({ canvas }) => {
    const amount = canvas.getByTestId('amount')
    const width = amount.getBoundingClientRect().width
    await expect(getComputedStyle(amount).maskImage).toBe('none')
    await userEvent.click(canvas.getByRole('button', { name: 'Change amount' }))
    await waitFor(() =>
      expect(getComputedStyle(amount).maskImage).not.toBe('none')
    )
    await expect(amount.getBoundingClientRect().width).toBe(width)
    await userEvent.click(canvas.getByRole('button', { name: 'Change amount' }))
    await waitFor(() => expect(getComputedStyle(amount).maskImage).toBe('none'))
  },
}
