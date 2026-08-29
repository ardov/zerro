import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  Checkbox as MuiCheckbox,
  CircularProgress as MuiCircularProgress,
  FormControlLabel,
  InputBase as MuiInputBase,
  Switch as MuiSwitch,
} from '@mui/material'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Checkbox, CheckboxField } from './Checkbox'
import { CircularProgress } from './CircularProgress'
import { InputBase } from './InputBase'
import { Switch } from './Switch'

const meta = {
  title: 'UI/Controls',
  parameters: { layout: 'padded' },
} satisfies Meta
export default meta
type Story = StoryObj

const metrics = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect()
  const style = getComputedStyle(el)
  return {
    height: Math.round(rect.height),
    width: Math.round(rect.width),
    padding: style.padding,
    margin: style.margin,
    radius: style.borderRadius,
    display: style.display,
  }
}

/** The glyph is what a checkbox is; the box around it is only its hit area. */
function CheckboxPair({ checked }: { checked: boolean }) {
  return (
    <div className="flex gap-8">
      <div data-testid="owned">
        <Checkbox checked={checked} />
      </div>
      <div data-testid="mui">
        <MuiCheckbox checked={checked} color="primary" />
      </div>
    </div>
  )
}

const compareCheckbox: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const owned = canvas.getByTestId('owned')
  const mui = canvas.getByTestId('mui')
  const control = (host: HTMLElement) =>
    host.querySelector<HTMLElement>(
      '[data-slot="checkbox"], .MuiCheckbox-root'
    )!
  const glyph = (host: HTMLElement) => host.querySelector<HTMLElement>('svg')!
  await expect(metrics(glyph(owned))).toEqual(metrics(glyph(mui)))
  await expect(metrics(control(owned))).toEqual(metrics(control(mui)))
  await expect(getComputedStyle(glyph(owned)).color).toBe(
    getComputedStyle(glyph(mui)).color
  )
}

export const CheckboxUnchecked: Story = {
  render: () => <CheckboxPair checked={false} />,
  play: compareCheckbox,
}
export const CheckboxChecked: Story = {
  render: () => <CheckboxPair checked />,
  play: compareCheckbox,
}
export const DarkCheckboxChecked: Story = {
  ...CheckboxChecked,
  globals: { theme: 'dark' },
}

/** The label row: MUI pulls the control's padding back off the left edge so
 * the glyph lines up with whatever is above it. */
export const CheckboxWithLabel: Story = {
  render: function Render() {
    const [checked, setChecked] = useState(true)
    return (
      <div className="flex flex-col items-start gap-4">
        <div data-testid="owned">
          <CheckboxField
            label="Keep income"
            checked={checked}
            onCheckedChange={setChecked}
          />
        </div>
        <div data-testid="mui">
          <FormControlLabel
            label="Keep income"
            control={<MuiCheckbox checked={checked} color="primary" />}
          />
        </div>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const row = (id: string) =>
      canvas.getByTestId(id).querySelector<HTMLElement>('label')!
    await expect(metrics(row('owned'))).toEqual(metrics(row('mui')))
    const text = (id: string) => canvas.getByTestId(id).lastElementChild
    await expect(
      getComputedStyle(
        within(canvas.getByTestId('owned')).getByText('Keep income')
      ).font
    ).toBe(
      getComputedStyle(
        within(canvas.getByTestId('mui')).getByText('Keep income')
      ).font
    )
    void text
  },
}

/** Two sizes: the one the page loader uses and the one that fits in a button. */
export const Spinner: Story = {
  render: () => (
    <div className="flex gap-8">
      <div data-testid="owned">
        <CircularProgress />
        <CircularProgress size={24} />
      </div>
      <div data-testid="mui">
        <MuiCircularProgress />
        <MuiCircularProgress size={24} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const all = (id: string) =>
      Array.from(
        canvas
          .getByTestId(id)
          .querySelectorAll<HTMLElement>(
            '[data-slot="circular-progress"], .MuiCircularProgress-root'
          )
      )
    const ownedList = all('owned')
    const muiList = all('mui')
    for (let i = 0; i < ownedList.length; i++) {
      await expect(metrics(ownedList[i])).toEqual(metrics(muiList[i]))
      const arc = (el: HTMLElement) =>
        el.querySelector<SVGCircleElement>('circle')!
      const shape = (el: SVGCircleElement) => ({
        r: el.getAttribute('r'),
        strokeWidth: el.getAttribute('stroke-width'),
        box: el.ownerSVGElement!.getAttribute('viewBox'),
      })
      await expect(shape(arc(ownedList[i]))).toEqual(shape(arc(muiList[i])))
      // Both turn and both breathe, on the same clock.
      await waitFor(() =>
        expect(
          ownedList[i].getAnimations({ subtree: true }).map(a => a.playState)
        ).toEqual(
          muiList[i].getAnimations({ subtree: true }).map(a => a.playState)
        )
      )
    }
  },
}

/** Decorative only, so what matters is that it looks like MUI's. */
export const SwitchLook: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-8">
        <div data-testid="owned-off">
          <Switch edge="end" />
        </div>
        <div data-testid="mui-off">
          <MuiSwitch edge="end" checked={false} readOnly />
        </div>
      </div>
      <div className="flex gap-8">
        <div data-testid="owned-on">
          <Switch edge="end" checked />
        </div>
        <div data-testid="mui-on">
          <MuiSwitch edge="end" checked readOnly />
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const root = (id: string) =>
      canvas
        .getByTestId(id)
        .querySelector<HTMLElement>('[data-slot="switch"], .MuiSwitch-root')!
    for (const state of ['off', 'on']) {
      await expect(metrics(root(`owned-${state}`))).toEqual(
        metrics(root(`mui-${state}`))
      )
      const thumb = (id: string) =>
        canvas
          .getByTestId(id)
          .querySelector<HTMLElement>(
            '[data-slot="switch-thumb"], .MuiSwitch-thumb'
          )!
      const track = (id: string) =>
        canvas
          .getByTestId(id)
          .querySelector<HTMLElement>(
            '[data-slot="switch-track"], .MuiSwitch-track'
          )!
      const box = (el: HTMLElement) => {
        const r = el.getBoundingClientRect()
        const s = getComputedStyle(el)
        return {
          width: Math.round(r.width),
          height: Math.round(r.height),
          radius: s.borderRadius,
          background: s.backgroundColor,
          opacity: s.opacity,
        }
      }
      await expect(box(track(`owned-${state}`))).toEqual(
        box(track(`mui-${state}`))
      )
      await expect(box(thumb(`owned-${state}`))).toEqual(
        box(thumb(`mui-${state}`))
      )
    }
  },
}

/** No decoration of its own: the surface around it belongs to the call site. */
export const Field: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div data-testid="owned">
        <InputBase placeholder="Search" className="w-[280px]" />
      </div>
      <div data-testid="mui">
        <MuiInputBase placeholder="Search" className="w-[280px]" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = (id: string) =>
      within(canvas.getByTestId(id)).getByPlaceholderText('Search')
    await expect(metrics(input('owned'))).toEqual(metrics(input('mui')))
    const root = (id: string) =>
      canvas
        .getByTestId(id)
        .querySelector<HTMLElement>(
          '[data-slot="input-base"], .MuiInputBase-root'
        )!
    await expect(metrics(root('owned'))).toEqual(metrics(root('mui')))
    await expect(getComputedStyle(input('owned')).font).toBe(
      getComputedStyle(input('mui')).font
    )
  },
}

/** `InputBase` uses the same content-sized textarea as the outlined field. */
export const GrowingField: Story = {
  render: function Render() {
    const [value, setValue] = useState('First line')
    return (
      <InputBase
        multiline
        value={value}
        onChange={event => setValue(event.target.value)}
        aria-label="Comment"
        className="w-[280px]"
      />
    )
  },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: 'Comment' })
    const initialHeight = field.getBoundingClientRect().height
    await userEvent.type(field, '{Enter}Second line')
    await waitFor(() =>
      expect(field.getBoundingClientRect().height).toBeGreaterThan(initialHeight)
    )
  },
}
