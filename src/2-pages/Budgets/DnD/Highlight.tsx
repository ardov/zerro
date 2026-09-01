import type { ById } from '@/6-shared/types'

import { useCallback, useRef, useState } from 'react'
import type { DragEndEvent, DragMoveEvent } from '@dnd-kit/core'
import { useDndMonitor } from '@dnd-kit/core'
import { useAppDispatch, useAppSelector } from '@/store/index'
import { core } from '@/zerro-core/redux'

import { moveEnvelope } from '@/4-features/envelope/moveEnvelope'
import { DragTypes } from './dragTypes'

const OFFSET = 100

export function Highlight() {
  const dispatch = useAppDispatch()
  const [isDragging, setIsDragging] = useState(false)

  const envelopes = useAppSelector(core.envelopes.selectAll)

  const boxRef = useRef<HTMLDivElement>(null)

  const onDragMove = useCallback(
    (e: DragMoveEvent) => {
      const el = boxRef.current
      if (!el) return
      const info = whatsHappening(e, envelopes, OFFSET)

      if (!info) {
        el.style.display = `none`
        return
      }

      if (
        info.activeType === DragTypes.envelope &&
        info.overType === DragTypes.envelope
      ) {
        const width = info.overRect.width - (info.isNesting ? OFFSET : 0)
        const left = info.overRect.left + (info.isNesting ? OFFSET : 0)
        const top = info.overRect.top + info.overRect.height
        el.style.display = `block`
        el.style.width = `${width}px`
        el.style.height = `2px`
        el.style.transform = `translate(${left}px, ${top}px)`
      }

      if (
        info.activeType === DragTypes.amount &&
        info.overType === DragTypes.envelope
      ) {
        const brdr = 4
        el.style.display = `block`
        el.style.width = `${info.overRect.width + brdr * 2}px`
        el.style.height = `${info.overRect.height + brdr * 2}px`
        el.style.transform = `translate(${info.overRect.left - brdr}px, ${
          info.overRect.top - brdr
        }px)`
      }
    },
    [envelopes]
  )

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      setIsDragging(false)
      const info = whatsHappening(e, envelopes, OFFSET)
      if (!info) return

      if (
        info.activeType === DragTypes.envelope &&
        info.overType === DragTypes.envelope
      ) {
        const activeEnv = envelopes[info.activeId]
        const overEnv = envelopes[info.overId]
        if (activeEnv.id === overEnv.id) return
        if (overEnv.parent && activeEnv.id === overEnv.parent) return
        dispatch(moveEnvelope(activeEnv.index, overEnv.index, info.isNesting))
      }
    },
    [dispatch, envelopes]
  )

  const onDragCancel = useCallback(() => {
    setIsDragging(false)
    if (boxRef.current) {
      boxRef.current.style.display = `none`
    }
  }, [])

  useDndMonitor({
    onDragStart: () => setIsDragging(true),
    onDragMove,
    onDragEnd,
    onDragCancel,
  })

  return isDragging ? (
    <div
      ref={boxRef}
      className="fixed left-0 top-0 z-[100] hidden h-[2px] w-[100px] rounded-lg border border-primary transition-[transform,width,height] duration-100 ease-in-out will-change-[transform,width,height]"
    />
  ) : null
}

function whatsHappening(
  e: DragEndEvent | DragMoveEvent,
  envelopes: ById<core.envelopes.TPresentedEnvelope>,
  offset: number
) {
  const activeData = e.active.data.current
  const activeRect = e.active.rect.current.translated
  const overData = e.over?.data.current
  const overRect = e.over?.rect

  if (
    // has active
    !activeData ||
    !activeData.id ||
    !activeRect ||
    // has over
    !overData ||
    !overData.id ||
    overData.type !== DragTypes.envelope ||
    // overData.type !== DragTypes.newGroup ||
    !overRect
  ) {
    return null
  }

  const overEnv = envelopes[overData.id as core.envelopes.TEnvelopeId]
  const isOverChild = !!overEnv?.parent
  const isLastVisibleChild = !!overData.isLastVisibleChild
  const isExpanded = !!overData.isExpanded
  const tryingToNest = activeRect.left - overRect.left > offset

  return {
    isOverChild,
    isNesting:
      // overData.type === DragTypes.newGroup ||
      getNestingState(
        tryingToNest,
        isOverChild,
        isLastVisibleChild,
        isExpanded
      ),

    activeId: activeData.id as core.envelopes.TEnvelopeId,
    activeType: activeData.type as DragTypes,
    activeRect: activeRect,

    overId: overData.id as core.envelopes.TEnvelopeId,
    overType: overData.type as DragTypes,
    overRect: overRect,
  }
}

function getNestingState(
  tryingToNest: boolean,
  overChild: boolean,
  overLastVisibleChild: boolean,
  isExpanded: boolean
) {
  if (overChild) {
    // Child
    if (overLastVisibleChild) return tryingToNest
    return true
  } else {
    // Parent
    if (isExpanded) return true
    return tryingToNest
  }
}
