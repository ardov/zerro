import { StrictMode, useEffect, useState, type ReactNode } from 'react'
import { useOwnedPopup } from '../ui/kit/useOwnedPopup'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
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
    const { open, setOpen } = usePopup()
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
    const { open: menuOpen, setOpen: setMenuOpen } = usePopup()
    const { open: editorOpen, setOpen: setEditorOpen } = usePopup()
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

describe('owner close notifications', () => {
  function Editor({ onClose }: { onClose: (value: string) => void }) {
    const [draft, setDraft] = useState('initial')
    const popup = usePopup(() => onClose(draft))
    const { open, setOpen } = useOwnedPopup({ popup })
    const [branch, setBranch] = useState(false)
    return (
      <>
        <button onClick={() => setOpen(true)}>edit</button>
        {open && (
          <div key={String(branch)}>
            <input
              aria-label="draft"
              value={draft}
              onChange={e => setDraft(e.target.value)}
            />
            <button onClick={() => setBranch(!branch)}>adapt</button>
            <button onClick={() => setOpen(false)}>close editor</button>
          </div>
        )}
      </>
    )
  }

  it('delivers the latest draft once for Back and programmatic close, never for adaptation', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <StrictMode>
        <App>
          <Editor onClose={onClose} />
        </App>
      </StrictMode>
    )
    await user.click(screen.getByText('edit'))
    await user.clear(screen.getByLabelText('draft'))
    await user.type(screen.getByLabelText('draft'), 'changed')
    await user.click(screen.getByText('adapt'))
    expect(onClose).not.toHaveBeenCalled()
    await user.click(screen.getByText('back'))
    expect(onClose.mock.calls).toEqual([['changed']])
    await user.click(screen.getByText('edit'))
    await user.click(screen.getByText('close editor'))
    expect(onClose.mock.calls).toEqual([['changed'], ['changed']])
  })

  it('releases an unmounted owner without saving a draft', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    function Owner() {
      const [mounted, setMounted] = useState(true)
      return (
        <>
          <button onClick={() => setMounted(false)}>remove owner</button>
          {mounted && <Editor onClose={onClose} />}
        </>
      )
    }
    render(
      <App>
        <Owner />
      </App>
    )
    await user.click(screen.getByText('edit'))
    await user.click(screen.getByText('remove owner'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('notifies the asked owner on Back with its latest draft', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    function AskedEditor() {
      const [draft, setDraft] = useState('initial')
      const { open } = useAsked(() => onClose(draft))
      return (
        open && (
          <input
            aria-label="asked draft"
            value={draft}
            onChange={e => setDraft(e.target.value)}
          />
        )
      )
    }
    function Launcher() {
      const ask = useAsk()
      return (
        <button onClick={() => void ask(<AskedEditor />)}>ask editor</button>
      )
    }
    render(
      <App>
        <Launcher />
      </App>
    )
    await user.click(screen.getByText('ask editor'))
    await user.clear(await screen.findByLabelText('asked draft'))
    await user.type(screen.getByLabelText('asked draft'), 'latest')
    await user.click(screen.getByText('back'))
    expect(onClose.mock.calls).toEqual([['latest']])
  })

  it('notifies the stable screen owner after conditional content unmounts', async () => {
    const editor = defineScreen<string>('close-test')
    const onClose = vi.fn()
    const user = userEvent.setup()
    function ScreenOwner() {
      const [draft, setDraft] = useState('initial')
      const [value, setValue] = editor.use(() => onClose(draft))
      return (
        <>
          <button onClick={() => setValue('open')}>open screen</button>
          {value && (
            <div>
              <input
                aria-label="screen draft"
                value={draft}
                onChange={e => setDraft(e.target.value)}
              />
              <button onClick={() => setValue(null)}>close screen</button>
            </div>
          )}
        </>
      )
    }
    render(
      <StrictMode>
        <App>
          <ScreenOwner />
        </App>
      </StrictMode>
    )
    await user.click(screen.getByText('open screen'))
    await user.clear(screen.getByLabelText('screen draft'))
    await user.type(screen.getByLabelText('screen draft'), 'latest')
    await user.click(screen.getByText('back'))
    expect(screen.queryByLabelText('screen draft')).toBeNull()
    expect(onClose.mock.calls).toEqual([['latest']])
    await user.click(screen.getByText('open screen'))
    await user.click(screen.getByText('close screen'))
    expect(onClose.mock.calls).toEqual([['latest'], ['latest']])
  })

  it('keeps lifecycle independent from a wrapped change callback', async () => {
    const user = userEvent.setup()
    const closed = vi.fn()
    const changed = vi.fn()
    function Owner() {
      const controller = usePopup(closed)
      const setOpen = (open: boolean) => {
        changed(open)
        controller.setOpen(open)
      }
      return (
        <>
          <button onClick={() => setOpen(true)}>open wrapped</button>
          {controller.open && (
            <button onClick={() => setOpen(false)}>close wrapped</button>
          )}
        </>
      )
    }
    render(
      <App>
        <Owner />
      </App>
    )
    await user.click(screen.getByText('open wrapped'))
    await user.click(screen.getByText('close wrapped'))
    expect(closed).toHaveBeenCalledTimes(1)
    await user.click(screen.getByText('open wrapped'))
    await user.click(screen.getByText('back'))
    expect(closed).toHaveBeenCalledTimes(2)
    expect(changed.mock.calls).toEqual([[true], [false], [true]])
  })

  it('unsubscribes an owner immediately when it is removed', async () => {
    const user = userEvent.setup()
    const closed = vi.fn()
    const popupRef: { current?: ReturnType<typeof usePopup> } = {}
    function Owner() {
      const popup = usePopup(closed)
      useEffect(() => {
        popupRef.current = popup
      }, [popup])
      return <button onClick={() => popup.setOpen(true)}>open owner</button>
    }
    const view = render(
      <App>
        <Owner />
      </App>
    )
    await user.click(screen.getByText('open owner'))
    view.rerender(<App>{null}</App>)
    act(() => popupRef.current!.setOpen(false))
    expect(closed).not.toHaveBeenCalled()
  })

  it('keeps a nested popup subscription independent from its asked parent', async () => {
    const user = userEvent.setup()
    const childClosed = vi.fn()
    const parentClosed = vi.fn()
    function AskedParent() {
      const { open } = useAsked(parentClosed)
      const child = useOwnedPopup({ onClose: childClosed })
      return (
        open && (
          <>
            <button onClick={() => child.setOpen(true)}>open child</button>
            {child.open && (
              <button onClick={() => child.setOpen(false)}>close child</button>
            )}
          </>
        )
      )
    }
    function Launcher() {
      const ask = useAsk()
      return (
        <button onClick={() => void ask(<AskedParent />)}>ask parent</button>
      )
    }
    render(
      <App>
        <Launcher />
      </App>
    )
    await user.click(screen.getByText('ask parent'))
    await user.click(await screen.findByText('open child'))
    await user.click(screen.getByText('close child'))
    expect(childClosed).toHaveBeenCalledTimes(1)
    expect(parentClosed).not.toHaveBeenCalled()
    await user.click(screen.getByText('back'))
    expect(childClosed).toHaveBeenCalledTimes(1)
    expect(parentClosed).toHaveBeenCalledTimes(1)
  })
})
