export const check = conditions => tr => {
  const {
    search,
    type,
    showDeleted,
    fromDate,
    toDate,
    tags,
    accounts,
    amountFrom,
    amountTo
  } = conditions

  const checkSearch = () => {
    if (!search) return true
    if (tr.comment && tr.comment.toUpperCase().includes(search.toUpperCase()))
      return true
    if (tr.payee && tr.payee.toUpperCase().includes(search.toUpperCase()))
      return true

    return false
  }

  const checkTags = () => {
    if (!tags) return true
    if (!tr.tag) return false
    let result = false
    tr.tag.forEach(({ id }) => {
      if (tags.includes(id)) result = true
    })
    return result
  }

  const checkAmount = () => {
    if (!amountFrom && !amountTo) return true

    if (tr.type === 'income') {
      const income = tr.income * tr.incomeInstrument.rate
      return amountFrom <= income && income <= amountTo
    } else if (tr.type === 'outcome') {
      const outcome = tr.outcome * tr.outcomeInstrument.rate
      return amountFrom <= outcome && outcome <= amountTo
    } else if (tr.type === 'transfer') {
      const outcome = tr.outcome * tr.outcomeInstrument.rate
      const income = tr.income * tr.incomeInstrument.rate
      return (
        amountFrom <= income &&
        income <= amountTo &&
        (amountFrom <= outcome && outcome <= amountTo)
      )
    }
    console.warn('unknown type', tr.type)
    return false
  }

  return (
    (!type || tr.type === type) &&
    checkSearch() &&
    (showDeleted || !tr.deleted) &&
    (!fromDate || +tr.date >= +fromDate) &&
    (!toDate || +tr.date <= +toDate) &&
    checkTags() &&
    (!accounts ||
      accounts.includes(tr.incomeAccount) ||
      accounts.includes(tr.outcomeAccount)) &&
    checkAmount()
  )
}
