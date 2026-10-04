export type InteractionType = 'mouse' | 'touch' | 'pen' | 'keyboard' | ''

/** The last real input, tracked once for the whole document.
 *
 * Base UI keeps the same thing for its own dismissals, but does not expose it,
 * and a surface this app closes by setting `open={false}` — Back, a call site's
 * `onClose` — emits no `openchange` at all, so the close type Base UI hands to
 * `finalFocus` is an empty string. This is the answer for those.
 *
 * Its kind is also kept on the root as `data-input-modality`. A trigger that
 * gets focus back after a pointer closed its popup still matches
 * `:focus-visible` in Chrome: the popup returns focus by script, and the
 * browser carries visibility over from the element it leaves. Fields read the
 * attribute to keep that focus quiet, as a plain button's would be. */
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
