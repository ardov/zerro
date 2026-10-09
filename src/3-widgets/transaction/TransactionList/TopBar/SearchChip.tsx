import { useLayoutEffect, useRef, useState, type Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Chip } from '@/6-shared/ui/kit/Chip'
import { IconButton } from '@/6-shared/ui/kit/Button'
import { ButtonBase } from '@/6-shared/ui/kit/ButtonBase'
import { AnimatedItem } from '@/6-shared/ui/kit/AnimatedItem'
import { InputWidth } from '@/6-shared/ui/kit/InputWidth'
import { SearchIcon, CloseIcon } from '@/6-shared/ui/Icons'

/** Search edits the live query; collapsing never rolls back visible results. */
export function SearchChip({
  value,
  onChange,
  ref,
}: {
  value: string
  onChange: (value: string) => void
  ref: Ref<HTMLElement>
}) {
  const { t } = useTranslation('filterDrawer')
  const [editing, setEditing] = useState(false)
  const button = useRef<HTMLElement | null>(null)
  const input = useRef<HTMLInputElement | null>(null)
  const restoreFocus = useRef(false)
  useLayoutEffect(() => {
    // Re-entering during the exit animation reuses the input, so autoFocus
    // alone is insufficient: focus follows editing intent, not DOM mounting.
    if (editing) input.current?.focus()
  }, [editing])
  useLayoutEffect(() => {
    if (!editing && restoreFocus.current) {
      restoreFocus.current = false
      button.current?.focus()
    }
  }, [editing, value])
  const reduce = useReducedMotion()
  const setButton = (node: HTMLElement | null) => {
    if (!node) return
    button.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
    return () => {
      // An exiting branch must not clear the new branch's focus target.
      if (button.current !== node) return
      button.current = null
      if (typeof ref === 'function') ref(null)
      else if (ref) ref.current = null
    }
  }
  const finish = () => {
    setEditing(false)
    onChange(value.trim())
  }
  const open = () => {
    setEditing(true)
  }
  return (
    <motion.div
      layout={reduce ? false : true}
      layoutDependency={editing}
      transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
      style={{ borderRadius: 16 }}
      className="relative min-w-0 max-w-full"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <AnimatedItem key={editing ? 'editing' : value ? 'query' : 'empty'}>
          {editing ? (
            <div
              className="flex h-8 min-w-0 max-w-full items-center rounded-2xl border border-ui-border bg-ui-selected pl-1 pr-1 text-ui-16 focus-within:outline-2 focus-within:outline-ui-focus"
              onBlur={event => {
                if (
                  !event.currentTarget.parentElement?.inert &&
                  !event.currentTarget.contains(event.relatedTarget)
                )
                  finish()
              }}
            >
              <span className="flex size-8 shrink-0 items-center justify-center">
                <SearchIcon />
              </span>
              <InputWidth
                value={value}
                placeholder={t('search')}
                className="min-w-12"
              >
                <input
                  ref={input}
                  autoFocus
                  aria-label={t('search')}
                  placeholder={t('search')}
                  value={value}
                  className="h-full w-full min-w-0 border-0 bg-transparent p-0 text-ui-primary outline-none placeholder:text-ui-placeholder"
                  onChange={event => onChange(event.target.value)}
                  onKeyDown={event => {
                    if (event.nativeEvent.isComposing) return
                    if (event.key === 'Enter' || event.key === 'Escape') {
                      event.preventDefault()
                      event.stopPropagation()
                      restoreFocus.current = true
                      finish()
                    }
                  }}
                />
              </InputWidth>
              <ButtonBase
                type="button"
                aria-label={t('clearField')}
                className="ml-1 size-6 shrink-0 rounded-full hover:bg-ui-highlight active:bg-ui-pressed"
                onMouseDown={event => event.preventDefault()}
                onClick={() => {
                  restoreFocus.current = true
                  onChange('')
                  setEditing(false)
                }}
              >
                <CloseIcon className="size-4" />
              </ButtonBase>
            </div>
          ) : value ? (
            <Chip
              ref={setButton}
              overflow="fade"
              start={<SearchIcon />}
              onClick={open}
              onRemove={() => {
                restoreFocus.current = true
                onChange('')
              }}
            >
              {value}
            </Chip>
          ) : (
            <IconButton
              ref={setButton}
              size="xs"
              variant="ghost"
              label={t('search')}
              onClick={open}
            >
              <SearchIcon />
            </IconButton>
          )}
        </AnimatedItem>
      </AnimatePresence>
    </motion.div>
  )
}
