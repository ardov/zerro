import { t } from 'i18next'
import { TEnvelopeId } from '5-entities/envelope'
import { envelopes as coreEnvelopes } from 'zerro-core/redux'

import { AppThunk } from 'store/index'

export function assignNewGroup(id: TEnvelopeId): AppThunk {
  return (dispatch, getState) => {
    const structure = coreEnvelopes.selectStructure(getState())
    const groupName = getNewGroupName(structure)

    // Cut the envelope out of its current place. A top-level envelope keeps
    // its children; a nested one moves out alone.
    let moved: coreEnvelopes.TEnvelopeStructureNodeInput = { id }
    const rest = coreEnvelopes
      .toEnvelopeStructureInput(structure)
      .map(group => ({
        ...group,
        children: group.children
          .filter(node => {
            if (node.id !== id) return true
            moved = node
            return false
          })
          .map(node => ({
            ...node,
            children: node.children?.filter(child => child.id !== id),
          })),
      }))

    dispatch(
      coreEnvelopes.applyStructure([
        { group: groupName, children: [moved] },
        ...rest,
      ])
    )
  }
}

function getNewGroupName(structure: { id: string }[]) {
  const baseName = t('groupNew', { ns: 'common' })
  let names = structure
    .map(group => group.id)
    .filter(name => name.startsWith(baseName))
  if (names.length === 0) return baseName

  let i = 2
  while (names.indexOf(`${baseName} ${i}`) >= 0) {
    i++
  }
  return `${baseName} ${i}`
}
