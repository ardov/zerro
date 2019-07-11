const populate = raw => ({
  id: raw.id,
  title: raw.title,
  shortTitle: raw.shortTitle,
  symbol: raw.symbol,
  rate: raw.rate,
  changed: raw.changed * 1000,
})

export default populate
