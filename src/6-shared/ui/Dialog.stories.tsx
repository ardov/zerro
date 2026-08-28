import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import {
  Dialog as MuiDialog,
  DialogActions as MuiDialogActions,
  DialogContent as MuiDialogContent,
  DialogContentText as MuiDialogContentText,
  DialogTitle as MuiDialogTitle,
} from '@mui/material'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from './Dialog'

const meta = {
  title: 'UI/Dialog',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta
type Story = StoryObj

const title = 'Delete this operation?'
const description =
  'It will be gone from every device once the change syncs. This text is long enough to run onto a second line in the paper.'

function Body({
  Title,
  Content,
  Text,
  Actions,
  onClose,
}: {
  Title: typeof DialogTitle
  Content: typeof DialogContent
  Text: typeof DialogContentText
  Actions: typeof DialogActions
  onClose: () => void
}) {
  return (
    <>
      <Title>{title}</Title>
      <Content>
        <Text>{description}</Text>
      </Content>
      {/* Plain buttons: MUI spaces a dialog's actions with a `margin-left` on
          the second child, which a component of ours would reset from the
          later layer — this compares the containers, not the buttons. */}
      <Actions>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button type="button" onClick={onClose}>
          Delete
        </button>
      </Actions>
    </>
  )
}

function Harness() {
  const [which, setWhich] = useState<'none' | 'owned' | 'mui'>('none')
  const close = () => setWhich('none')
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => setWhich('owned')}>
        Open owned
      </button>
      <button type="button" onClick={() => setWhich('mui')}>
        Open MUI
      </button>

      <Dialog open={which === 'owned'} onClose={close}>
        <Body
          Title={DialogTitle}
          Content={DialogContent}
          Text={DialogContentText}
          Actions={DialogActions}
          onClose={close}
        />
      </Dialog>

      <MuiDialog open={which === 'mui'} onClose={close}>
        <Body
          Title={MuiDialogTitle as typeof DialogTitle}
          Content={MuiDialogContent as typeof DialogContent}
          Text={MuiDialogContentText as typeof DialogContentText}
          Actions={MuiDialogActions as typeof DialogActions}
          onClose={close}
        />
      </MuiDialog>
    </div>
  )
}

/** The paper, its three slots, and the 8px MUI leaves between two actions. */
const measure = (body: HTMLElement) => {
  const paper = body.querySelector<HTMLElement>(
    '[data-slot="dialog"], .MuiDialog-paper'
  )!
  const heading = body.querySelector<HTMLElement>('h2')!
  const text = body.querySelector<HTMLElement>('p')!
  const buttons = [...body.querySelectorAll('button')].filter(button =>
    /Cancel|Delete/.test(button.textContent ?? '')
  )
  const box = (el: HTMLElement) => {
    const s = getComputedStyle(el)
    return {
      padding: s.padding,
      margin: s.margin,
      fontSize: s.fontSize,
      lineHeight: s.lineHeight,
      fontWeight: s.fontWeight,
      color: s.color,
    }
  }
  const paperStyle = getComputedStyle(paper)
  return {
    paper: {
      ...box(paper),
      radius: paperStyle.borderRadius,
      shadow: paperStyle.boxShadow,
      background: paperStyle.backgroundColor,
      maxWidth: paperStyle.maxWidth,
      maxHeight: paperStyle.maxHeight,
      display: paperStyle.display,
      direction: paperStyle.flexDirection,
      width: Math.round(paper.getBoundingClientRect().width),
    },
    heading: box(heading),
    text: box(text),
    actionGap: Math.round(
      buttons[1].getBoundingClientRect().left -
        buttons[0].getBoundingClientRect().right
    ),
    contentPadding: getComputedStyle(
      body.querySelector<HTMLElement>(
        '[data-slot="dialog-content"], .MuiDialogContent-root'
      )!
    ).padding,
    actionsPadding: getComputedStyle(
      body.querySelector<HTMLElement>(
        '[data-slot="dialog-actions"], .MuiDialogActions-root'
      )!
    ).padding,
  }
}

/** One at a time: two modals at once would fight over focus and the scroll
 * lock, and the geometry is what is being compared, not the stacking. */
async function shotOf(
  canvas: ReturnType<typeof within>,
  body: ReturnType<typeof within>,
  name: string
) {
  await userEvent.click(canvas.getByRole('button', { name }))
  const dialog = await body.findByRole('dialog')
  await waitFor(() => expect(getComputedStyle(dialog).opacity).toBe('1'))
  const shot = measure(dialog.ownerDocument.body)
  await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
  await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
  return shot
}

export const Parity: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const owned = await shotOf(canvas, body, 'Open owned')
    const mui = await shotOf(canvas, body, 'Open MUI')
    expect(owned).toEqual(mui)
  },
}

export const DarkParity: Story = {
  ...Parity,
  globals: { theme: 'dark' },
}

/** The dismissals MUI's `Modal` gives every dialog. */
export const Dismissal: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('button', { name: 'Open owned' })

    await userEvent.click(trigger)
    await body.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())

    await userEvent.click(trigger)
    const dialog = await body.findByRole('dialog')
    // Outside the paper is the backdrop, wherever the pointer lands on it.
    await userEvent.click(dialog.ownerDocument.body)
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}
