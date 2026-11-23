export type InteractionType = 'mouse' | 'touch' | 'pen' | 'keyboard' | ''

/** Track real input for controlled closes: Base UI receives no close modality when open is set directly.
 * Fields use the root modality to suppress a pointer-induced focus ring on return. */
let lastInteraction: InteractionType = ''

export const getLastInteraction = () => lastInteraction

/** What closes a surface is whatever happens after it opened, not whatever
 * last happened on the page before it. The attribute keeps the real input. */
export const forgetLastInteraction = () => {
  lastInteraction = ''
}

if (typeof document !== 'undefined') {
  const root = document.documentElement
  const record = (interaction: Exclude<InteractionType, ''>) => {
    lastInteraction = interaction
    const modality = interaction === 'keyboard' ? 'keyboard' : 'pointer'
    if (root.dataset.inputModality !== modality)
      root.dataset.inputModality = modality
  }
  document.addEventListener(
    'pointerdown',
    event =>
      record(
        event.pointerType === 'touch' || event.pointerType === 'pen'
          ? event.pointerType
          : 'mouse'
      ),
    true
  )
  document.addEventListener(
    'keydown',
    event => {
      // A modifier alone is not navigation, and app switching starts with one.
      if (['Meta', 'Control', 'Alt', 'Shift'].includes(event.key)) return
      record('keyboard')
    },
    true
  )
}
