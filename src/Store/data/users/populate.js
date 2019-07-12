const populate = (instruments, countries, raw) => ({
  id: raw.id,
  parent: raw.parent,
  login: raw.login,

  country: countries[raw.country],
  countryCode: raw.countryCode,
  currency: instruments[raw.currency],

  paidTill: raw.paidTill * 1000,
  subscription: raw.subscription,

  changed: raw.changed * 1000,
})

export default populate
