import createSelector from 'selectorator'

export const normalize = raw => ({
  id: raw.id,
  title: raw.title,
  shortTitle: raw.shortTitle,
  symbol: raw.symbol,
  rate: raw.rate,
  changed: raw.changed * 1000
})

export const getInstrumentsById = createSelector(
  ['data.instrument'],
  instruments => {
    const result = {}
    for (const id in instruments) {
      result[id] = normalize(instruments[id])
    }
    return result
  }
)

export const getInstrument = (state, id) => getInstrumentsById(state)[id]
