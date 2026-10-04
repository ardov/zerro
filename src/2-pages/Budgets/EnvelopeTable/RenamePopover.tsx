import { useRef, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsked } from '@/6-shared/overlays'
import { Input } from '@/6-shared/ui/kit/Input'
import { PopoverSurface } from '@/6-shared/ui/kit/Popover'

/** «What should it be called?». Answers the new name, or nothing when it is
 * unchanged. Closing keeps a changed draft, as Enter does.
 *
 * An ordinary field surfaces over the name it renames: it takes the anchor's
 * own type and sits so that its text covers the anchor's text exactly, so
 * nothing jumps when it opens. The anchor is the text element itself, not a
 * padded wrapper. */
export function RenamePopover(props: {
  value: string
  anchor: Element | null
}) {
  const { value, anchor } = props
  const { t } = useTranslation()
  const [draft, setDraft] = useState(value)
  const [font] = useState(() => readFont(anchor))
  const changed = draft !== value
  const { controller, answer } = useAsked<string>(answer => {
    if (changed) answer(draft)
  })
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Where the field's text starts inside the popover: its own padding, read
  // from the page rather than repeated here.
  const inset = (axis: 'left' | 'top') => {
    const form = formRef.current?.getBoundingClientRect()
    const input = inputRef.current?.getBoundingClientRect()
    return form && input ? input[axis] - form[axis] : 0
  }
  return (
    <PopoverSurface
      controller={controller}
      label={t('rename')}
      anchor={anchor}
      mobile="popover"
      sideOffset={({ anchor }) => -anchor.height - inset('top')}
      alignOffset={() => -inset('left')}
      // Staying over the name matters more than a few pixels past an edge.
      collisionAvoidance={{ side: 'none', align: 'none' }}
      initialFocus={inputRef}
      // The popover is only the field's elevation: same shape, no padding.
      className="w-[calc(var(--anchor-width)+3rem)] min-w-64 rounded-ui-control bg-ui-card"
      contentClassName="p-0"
    >
      <form
        ref={formRef}
        onSubmit={event => {
          event.preventDefault()
          answer(changed ? draft : undefined)
        }}
      >
        <Input
          ref={inputRef}
          label={t('rename')}
          value={draft}
          onValueChange={setDraft}
          autoComplete="off"
          controlStyle={font}
        />
      </form>
    </PopoverSurface>
  )
}

function readFont(anchor: Element | null): CSSProperties | undefined {
  if (!anchor) return undefined
  const style = getComputedStyle(anchor)
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontStyle: style.fontStyle,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
  }
}
