import { useState } from 'react'
import { Collapse } from '@/6-shared/ui/kit/Collapse'
import { useDroppable } from '@dnd-kit/core'
import { DragTypes } from '../DnD'
import { useTranslation } from 'react-i18next'

export function NewGroup(props: { visible: boolean }) {
  const { t } = useTranslation('creatingNewGroup')
  const { visible } = props
  const [clicked, setClicked] = useState(false)
  const { setNodeRef, active, isOver } = useDroppable({
    id: 'newGroup',
    disabled: !visible,
    data: { type: DragTypes.newGroup, id: DragTypes.newGroup },
  })
  const canDrop = active?.data?.current?.type === DragTypes.envelope

  const text = isOver
    ? canDrop
      ? t('okDropIt')
      : t('categoryNeeded')
    : clicked
      ? t('dropCategoryHere')
      : t('newGroup')
  return (
    <Collapse open={visible}>
      <div ref={setNodeRef} className="px-4 py-2">
        <div
          className={`rounded-2xl border border-dashed border-ui-border p-4 text-center ${isOver && canDrop ? 'bg-ui-selected' : 'bg-ui-card'}`}
          onClick={() => setClicked(true)}
        >
          {text}
        </div>
      </div>
    </Collapse>
  )
}
