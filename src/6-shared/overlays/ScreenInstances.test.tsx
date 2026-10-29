import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { OverlayHost } from './OverlayHost'
import { usePopup } from './usePopup'
import { defineScreen } from './defineScreen'
import { defineScreenInstances } from './defineScreenInstances'

const lists = defineScreenInstances<{ title: string; search: string }>(
  'test-list'
)

function Harness({ onClose }: { onClose?: (id: string) => void } = {}) {
  const { instances, setValue, close, remove } = lists.use()
  const open = lists.useOpen()
  const navigate = useNavigate()
  const location = useLocation()
  const menu = usePopup()
  const childMenu = usePopup()
  return (
    <>
      <button onClick={() => open({ title: 'List', search: '' })}>
        open list
      </button>
      <button
        onClick={() => {
          open({ title: 'List', search: '' })
          open({ title: 'List', search: '' })
        }}
      >
        open pair
      </button>
      <button
        onClick={() => {
          const first = instances[0]
          if (first) close(first.id, { through: true })
          open({ title: 'Next', search: '' })
        }}
      >
        close pair and open next
      </button>
      <button onClick={() => menu.setOpen(true)}>open menu</button>
      <button onClick={() => childMenu.setOpen(true)}>open child menu</button>
      {menu.open && <div>menu body</div>}
      {childMenu.open && <div>child menu body</div>}
      <button onClick={() => navigate(-1)}>back</button>
      <button onClick={() => navigate(1)}>forward</button>
      <output data-testid="address">{JSON.stringify(location.state)}</output>
      <output data-testid="path">{location.pathname}</output>
      {instances.map(({ id, value }) => (
        <section key={id} data-testid="instance">
          <CloseObserver id={id} onClose={() => onClose?.(id)} />
          <h2>{value.title}</h2>
          <input
            aria-label={`search ${id}`}
            value={value.search}
            onChange={e =>
              setValue(id, old => ({ ...old, search: e.target.value }))
            }
          />
          <button onClick={() => close(id)}>close</button>
          <button onClick={() => close(id, { through: true })}>
            close through
          </button>
          <button onClick={() => remove(id)}>remove</button>
        </section>
      ))}
    </>
  )
}

function CloseObserver({ id, onClose }: { id: string; onClose: () => void }) {
  lists.useInstance(id, onClose)
  return null
}

function App() {
  return (
    <MemoryRouter>
      <OverlayHost>
        <Harness />
      </OverlayHost>
    </MemoryRouter>
  )
}

describe('repeatable screens', () => {
  it.each([
    { initialIndex: 1, source: 'after reload' },
    { initialIndex: 0, source: 'after arriving on a newer entry' },
  ])(
    'retains the lower list view $source when Back uncovers an older history entry',
    async ({ initialIndex }) => {
      const views = defineScreenInstances<{
        query: { clauses: { kind: 'merchant'; ids: string[] }[] }
        search: string
        checked: string[]
        topDate: string | null
        scrollOffset: number | null
      }>('restored-list')
      const details = defineScreenInstances<{ ownerListId: string }>(
        'restored-details'
      )
      const listId = 'screen:restored-list:list'
      const detailsId = 'screen:restored-details:details'
      const savedView = {
        query: { clauses: [{ kind: 'merchant', ids: ['lidl'] }] },
        search: 'groceries',
        checked: ['lunch'],
        topDate: '2026-10-09',
        scrollOffset: 647,
      }
      function RestoredView() {
        const { instances } = views.use()
        const children = details.use().instances
        const navigate = useNavigate()
        return (
          <>
            <button onClick={() => navigate(-1)}>Back after reload</button>
            <button onClick={() => navigate(1)}>
              Forward to restored entry
            </button>
            <output data-testid="restored-view">
              {JSON.stringify(instances[0]?.value)}
            </output>
            <output data-testid="restored-details">{children.length}</output>
          </>
        )
      }
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/',
              state: {
                overlays: {
                  ours: true,
                  screens: {
                    [listId]: {
                      query: { clauses: [] },
                      search: 'old',
                      checked: [],
                      topDate: null,
                      scrollOffset: 0,
                    },
                  },
                  revisions: { [listId]: 0 },
                },
              },
            },
            {
              pathname: '/',
              state: {
                overlays: {
                  ours: true,
                  screens: {
                    [listId]: savedView,
                    [detailsId]: { ownerListId: listId },
                  },
                  revisions: { [listId]: 1 },
                },
              },
            },
          ]}
          initialIndex={initialIndex}
        >
          <OverlayHost>
            <RestoredView />
          </OverlayHost>
        </MemoryRouter>
      )
      if (initialIndex === 0) {
        fireEvent.click(screen.getByText('Forward to restored entry'))
        await waitFor(() =>
          expect(screen.getByTestId('restored-details').textContent).toBe('1')
        )
      }
      expect(
        JSON.parse(screen.getByTestId('restored-view').textContent!)
      ).toEqual(savedView)
      fireEvent.click(screen.getByText('Back after reload'))
      await waitFor(() =>
        expect(screen.getByTestId('restored-details').textContent).toBe('0')
      )
      expect(
        JSON.parse(screen.getByTestId('restored-view').textContent!)
      ).toEqual(savedView)
    }
  )

  it('opens independent instances of the same screen and returns through them', async () => {
    render(<App />)
    fireEvent.click(screen.getByText('open pair'))
    expect(screen.getAllByTestId('instance')).toHaveLength(2)
    fireEvent.click(screen.getByText('back'))
    await waitFor(() =>
      expect(screen.getAllByTestId('instance')).toHaveLength(1)
    )
    fireEvent.click(screen.getByText('back'))
    await waitFor(() =>
      expect(screen.queryAllByTestId('instance')).toHaveLength(0)
    )
  })
  it('keeps a lower list view changed while its child is open when Back uncovers it', async () => {
    const mounted = render(<App />)
    fireEvent.click(screen.getByText('open list'))
    fireEvent.click(screen.getByText('open list'))
    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: 'updated while covered' },
    })
    expect((screen.getAllByRole('textbox')[0] as HTMLInputElement).value).toBe(
      'updated while covered'
    )
    fireEvent.click(screen.getByText('back'))
    await waitFor(() =>
      expect(screen.getAllByTestId('instance')).toHaveLength(1)
    )
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(
      'updated while covered'
    )
    const saved = JSON.parse(screen.getByTestId('address').textContent!)
    expect(Object.values(saved.overlays.screens)[0]).toEqual({
      title: 'List',
      search: 'updated while covered',
    })
    mounted.unmount()
    render(
      <MemoryRouter initialEntries={[{ pathname: '/', state: saved }]}>
        <OverlayHost>
          <Harness />
        </OverlayHost>
      </MemoryRouter>
    )
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(
      'updated while covered'
    )
  })

  it('notifies a closing owner before its passive cleanup even when Back unmounts it', async () => {
    const onClose = vi.fn()
    function Tracked({ id }: { id: string }) {
      lists.useInstance(id, onClose)
      return <div>tracked editor</div>
    }
    function Owner() {
      const { instances } = lists.use()
      const open = lists.useOpen()
      const navigate = useNavigate()
      return (
        <>
          <button onClick={() => open({ title: 'Tracked', search: '' })}>
            open tracked
          </button>
          <button onClick={() => navigate(-1)}>back tracked</button>
          {instances.map(instance => (
            <Tracked key={instance.id} id={instance.id} />
          ))}
        </>
      )
    }
    render(
      <MemoryRouter>
        <OverlayHost>
          <Owner />
        </OverlayHost>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('open tracked'))
    fireEvent.click(screen.getByText('back tracked'))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('tracked editor')).toBeNull()
  })

  it('removes an unavailable covered instance without closing its child or restoring it on Back', async () => {
    render(<App />)
    fireEvent.click(screen.getByText('open list'))
    fireEvent.click(screen.getByText('open list'))
    const child = screen.getAllByRole('textbox')[1]
    fireEvent.click(screen.getAllByText('remove')[0])
    await waitFor(() =>
      expect(screen.getAllByTestId('instance')).toHaveLength(1)
    )
    expect(screen.getByRole('textbox')).toBe(child)
    fireEvent.click(screen.getByText('back'))
    await waitFor(() =>
      expect(screen.queryAllByTestId('instance')).toHaveLength(0)
    )
  })

  it('closes a list and its Details together without consuming an extra Back later', async () => {
    render(<App />)
    fireEvent.click(screen.getByText('open list'))
    fireEvent.click(screen.getByText('open list'))
    fireEvent.click(screen.getAllByText('close through')[0])
    await waitFor(() =>
      expect(screen.queryAllByTestId('instance')).toHaveLength(0)
    )
    fireEvent.click(screen.getByText('open list'))
    fireEvent.click(screen.getByText('back'))
    await waitFor(() =>
      expect(screen.queryAllByTestId('instance')).toHaveLength(0)
    )
  })
  it('closes through Popup slots left below a child Screen and notifies each owner once', async () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <OverlayHost>
          <Harness onClose={onClose} />
        </OverlayHost>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('open list'))
    fireEvent.click(screen.getByText('open menu'))
    fireEvent.click(screen.getByText('open child menu'))
    fireEvent.click(screen.getByText('open list'))
    expect(screen.queryByText('menu body')).toBeNull()
    fireEvent.click(screen.getAllByText('close through')[0])
    await waitFor(() => {
      const address = JSON.parse(
        screen.getByTestId('address').textContent || 'null'
      )
      expect(Object.keys(address?.overlays?.screens ?? {})).toHaveLength(0)
    })
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(new Set(onClose.mock.calls.map(([id]) => id)).size).toBe(2)
    fireEvent.click(screen.getByText('open list'))
    fireEvent.click(screen.getByText('back'))
    await waitFor(() =>
      expect(screen.queryAllByTestId('instance')).toHaveLength(0)
    )
  })
  it('can open another singleton value after its unavailable value was removed', async () => {
    const singleton = defineScreen<string>('existing-singleton')
    function Owner() {
      const [value, set] = singleton.use()
      const remove = singleton.useRemove()
      return (
        <>
          <button onClick={() => set('A')}>open singleton A</button>
          <button onClick={() => set('B')}>open singleton B</button>
          <button onClick={remove}>remove singleton</button>
          <output data-testid="singleton">{value ?? 'closed'}</output>
        </>
      )
    }
    render(
      <MemoryRouter>
        <OverlayHost>
          <Owner />
        </OverlayHost>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('open singleton A'))
    fireEvent.click(screen.getByText('remove singleton'))
    await waitFor(() =>
      expect(screen.getByTestId('singleton').textContent).toBe('closed')
    )
    fireEvent.click(screen.getByText('open singleton B'))
    await waitFor(() =>
      expect(screen.getByTestId('singleton').textContent).toBe('B')
    )
  })
  it('closes an initial multi-screen group after a pushed child without leaving the app', async () => {
    const initial = {
      overlays: {
        screens: {
          'screen:test-list:initial-list': {
            title: 'Initial list',
            search: '',
          },
          'screen:test-list:initial-details': {
            title: 'Initial Details',
            search: '',
          },
        },
        ours: false,
      },
    }
    render(
      <MemoryRouter
        initialEntries={['/external', { pathname: '/budget', state: initial }]}
        initialIndex={1}
      >
        <OverlayHost>
          <Harness />
        </OverlayHost>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('open list'))
    fireEvent.click(screen.getAllByText('close through')[0])
    await waitFor(() =>
      expect(screen.queryAllByTestId('instance')).toHaveLength(0)
    )
    expect(screen.getByTestId('path').textContent).toBe('/budget')
    fireEvent.click(screen.getByText('back'))
    await waitFor(() =>
      expect(screen.getByTestId('path').textContent).toBe('/external')
    )
    expect(screen.getByTestId('address').textContent).toBe('null')
  })

  it('finishes a group close before replaying an immediately requested new list', async () => {
    render(<App />)
    fireEvent.click(screen.getByText('open pair'))
    fireEvent.click(screen.getByText('close pair and open next'))
    await waitFor(() =>
      expect(screen.getAllByTestId('instance')).toHaveLength(1)
    )
    expect(screen.getByRole('heading').textContent).toBe('Next')
    fireEvent.click(screen.getByText('back'))
    await waitFor(() =>
      expect(screen.queryAllByTestId('instance')).toHaveLength(0)
    )
  })

  it('removes an unavailable singleton below a live child without closing the child', async () => {
    const singleton = defineScreen<string>('covered-singleton')
    function Owner() {
      const [value, set] = singleton.use()
      const remove = singleton.useRemove()
      return (
        <>
          <button onClick={() => set('A')}>open base A</button>
          <button onClick={remove}>remove base A</button>
          <output data-testid="base A">{value ?? 'closed'}</output>
        </>
      )
    }
    render(
      <MemoryRouter>
        <OverlayHost>
          <Owner />
          <Harness />
        </OverlayHost>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('open base A'))
    fireEvent.click(screen.getByText('open list'))
    fireEvent.click(screen.getByText('remove base A'))
    expect(screen.getByTestId('base A').textContent).toBe('closed')
    expect(screen.getAllByTestId('instance')).toHaveLength(1)
    fireEvent.click(screen.getByText('back'))
    await waitFor(() => {
      expect(screen.queryAllByTestId('instance')).toHaveLength(0)
      expect(screen.getByTestId('address').textContent).toBe('null')
    })
    expect(screen.getByTestId('base A').textContent).toBe('closed')
  })
})
