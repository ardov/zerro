import type { ReactNode } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { OverlayHost } from './OverlayHost'
import { defineScreen } from './defineScreen'
import { useAsk, useAsked } from './useAsk'
import { usePopup } from './usePopup'

function App({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/budget']}>
      <OverlayHost>
        <Back />
        {children}
      </OverlayHost>
    </MemoryRouter>
  )
}

/** The browser's Back button. */
function Back() {
  const navigate = useNavigate()
  return <button onClick={() => navigate(-1)}>back</button>
}

describe('usePopup', () => {
  function Menu() {
    const [open, setOpen] = usePopup()
    return (
      <>
        <button onClick={() => setOpen(true)}>open menu</button>
        {open && <div>menu body</div>}
        {open && <button onClick={() => setOpen(false)}>dismiss</button>}
      </>
    )
  }

  it('opens, and Back closes it', async () => {
    const user = userEvent.setup()
    render(
      <App>
        <Menu />
      </App>
    )

    await user.click(screen.getByText('open menu'))
    expect(screen.getByText('menu body')).toBeTruthy()

    await user.click(screen.getByText('back'))
    expect(screen.queryByText('menu body')).toBeNull()
  })

  it('closes itself without leaving the page', async () => {
    const user = userEvent.setup()
    render(
      <App>
        <Menu />
      </App>
    )

    await user.click(screen.getByText('open menu'))
    await user.click(screen.getByText('dismiss'))
    expect(screen.queryByText('menu body')).toBeNull()
    // Still here: the page itself was never left.
    expect(screen.getByText('open menu')).toBeTruthy()
  })
})

describe('one popup handing over to another', () => {
  /** The filter bar: a menu picks a filter, and the editor for it opens as
   * the menu goes. The second one opens before the step that closes the first
   * has landed. */
  function Handover() {
    const [menuOpen, setMenuOpen] = usePopup()
    const [editorOpen, setEditorOpen] = usePopup()
    return (
      <>
        <button onClick={() => setMenuOpen(true)}>open menu</button>
        {menuOpen && (
          <button
            onClick={() => {
              setMenuOpen(false)
              setEditorOpen(true)
            }}
          >
            pick a filter
          </button>
        )}
        {editorOpen && <div>editor</div>}
      </>
    )
  }

  it('leaves the second one open', async () => {
    const user = userEvent.setup()
    render(
      <App>
        <Handover />
      </App>
    )

    await user.click(screen.getByText('open menu'))
    await user.click(screen.getByText('pick a filter'))
    expect(screen.getByText('editor')).toBeTruthy()
  })

  it('gives it a slot of its own, so Back closes it', async () => {
    const user = userEvent.setup()
    render(
      <App>
        <Handover />
      </App>
    )

    await user.click(screen.getByText('open menu'))
    await user.click(screen.getByText('pick a filter'))
    expect(screen.getByText('editor')).toBeTruthy()

    await user.click(screen.getByText('back'))
    expect(screen.queryByText('editor')).toBeNull()
    // Still here: the page itself was never left.
    expect(screen.getByText('open menu')).toBeTruthy()
  })
})

describe('useAsk', () => {
  function Confirm() {
    const { open, answer } = useAsked<boolean>()
    if (!open) return null
    return (
      <>
        <div>really?</div>
        <button onClick={() => answer(true)}>yes</button>
        <button onClick={() => answer(false)}>no</button>
      </>
    )
  }

  function Asker({ onAnswer }: { onAnswer: (v: boolean | undefined) => void }) {
    const ask = useAsk()
    return (
      <button onClick={async () => onAnswer(await ask<boolean>(<Confirm />))}>
        ask
      </button>
    )
  }

  it('hands back the answer', async () => {
    const user = userEvent.setup()
    const answers: unknown[] = []
    render(
      <App>
        <Asker onAnswer={v => answers.push(v)} />
      </App>
    )

    await user.click(screen.getByText('ask'))
    expect(screen.getByText('really?')).toBeTruthy()

    await user.click(screen.getByText('yes'))
    await act(async () => {})
    expect(answers).toEqual([true])
  })

  it('answers "no answer" when Back dismisses the question', async () => {
    const user = userEvent.setup()
    const answers: unknown[] = []
    render(
      <App>
        <Asker onAnswer={v => answers.push(v)} />
      </App>
    )

    await user.click(screen.getByText('ask'))
    await user.click(screen.getByText('back'))
    await act(async () => {})
    expect(answers).toEqual([undefined])
  })
})

describe('a screen opened from a popup takes its place', () => {
  const panel = defineScreen<true>('panel')

  function Menu() {
    const { open, answer } = useAsked<void>()
    const openPanel = panel.useOpen()
    if (!open) return null
    return (
      <>
        <div>menu body</div>
        <button onClick={() => openPanel(true)}>open panel</button>
        <button onClick={() => answer()}>dismiss</button>
      </>
    )
  }

  function Page() {
    const ask = useAsk()
    const [opened] = panel.use()
    return (
      <>
        <button onClick={() => ask(<Menu />)}>open menu</button>
        {opened && <div>panel body</div>}
      </>
    )
  }

  it('leads Back to the page rather than back into the menu', async () => {
    const user = userEvent.setup()
    render(
      <App>
        <Page />
      </App>
    )

    await user.click(screen.getByText('open menu'))
    await user.click(screen.getByText('open panel'))
    expect(screen.getByText('panel body')).toBeTruthy()
    expect(screen.queryByText('menu body')).toBeNull()

    await user.click(screen.getByText('back'))
    expect(screen.queryByText('panel body')).toBeNull()
    expect(screen.queryByText('menu body')).toBeNull()
    // Still on the page: one Back, one visible change, and no step wasted on
    // the slot the menu left behind.
    expect(screen.getByText('open menu')).toBeTruthy()
  })
})

describe('defineScreen', () => {
  const trPreview = defineScreen<string>('tr')

  function Screens() {
    const [id, setId] = trPreview.use()
    return (
      <>
        <button onClick={() => setId('a')}>open a</button>
        <button onClick={() => setId('b')}>open b</button>
        {id && <div>preview {id}</div>}
        {id && <button onClick={() => setId(null)}>close</button>}
      </>
    )
  }

  it('holds its value and closes with Back', async () => {
    const user = userEvent.setup()
    render(
      <App>
        <Screens />
      </App>
    )

    await user.click(screen.getByText('open a'))
    expect(screen.getByText('preview a')).toBeTruthy()

    await user.click(screen.getByText('back'))
    expect(screen.queryByText('preview a')).toBeNull()
  })

  it('hands over to the next value in one history step', async () => {
    const user = userEvent.setup()
    render(
      <App>
        <Screens />
      </App>
    )

    await user.click(screen.getByText('open a'))
    await user.click(screen.getByText('open b'))
    expect(screen.getByText('preview b')).toBeTruthy()

    await user.click(screen.getByText('back'))
    expect(screen.queryByText(/preview/)).toBeNull()
  })

  it('adds one history step for two opens in the same tick', async () => {
    const user = userEvent.setup()

    function DoubleTap() {
      const open = trPreview.useOpen()
      const [id] = trPreview.use()
      return (
        <>
          <button
            onClick={() => {
              open('a')
              open('b')
            }}
          >
            tap twice
          </button>
          {id && <div>preview {id}</div>}
        </>
      )
    }

    render(
      <App>
        <DoubleTap />
      </App>
    )

    await user.click(screen.getByText('tap twice'))
    expect(screen.getByText('preview b')).toBeTruthy()

    // One press, one visible change: the second open replaced the first
    // rather than stacking on a state it had not seen yet.
    await user.click(screen.getByText('back'))
    expect(screen.queryByText(/preview/)).toBeNull()
  })

  it('closes on its own the same way Back does', async () => {
    const user = userEvent.setup()
    render(
      <App>
        <Screens />
      </App>
    )

    await user.click(screen.getByText('open a'))
    await user.click(screen.getByText('close'))
    expect(screen.queryByText('preview a')).toBeNull()
    expect(screen.getByText('open a')).toBeTruthy()
  })
})
