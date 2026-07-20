import { t } from 'i18next'
import { core } from 'zerro-core/redux'

import { AppThunk } from 'store/index'

export function assignNewGroup(id: core.envelopes.TEnvelopeId): AppThunk {
  return (dispatch, getState) => {
    const structure = core.envelopes.selectStructure(getState())
    const groupName = getNewGroupName(structure)

    // Cut the envelope out of its current place. A top-level envelope keeps
    // its children; a nested one moves out alone.
    let moved: core.envelopes.TEnvelopeStructureNodeInput = { id }
    const rest = core.envelopes
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
      core.envelopes.applyStructure([
        { group: groupName, children: [moved] },
        ...rest,
      ])
    )
  }
}

function getNewGroupName(structure: { id: string }[]) {
  const baseName = t('groupNew', { ns: 'common' })
  const names = structure
    .map(group => group.id)
    .filter(name => name.startsWith(baseName))
  if (names.length === 0) return baseName

  let i = 2
  while (names.indexOf(`${baseName} ${i}`) >= 0) {
    i++
  }
  return `${baseName} ${i}`
}
