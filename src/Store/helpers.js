import parseDate from 'date-fns/parse'

export const populate = (
  {
    instrument,
    country,
    company,
    user,
    account,
    tag,
    budget,
    merchant,
    reminder,
    reminderMarker,
    transaction
  },
  el
) => {
  if (!el) return false
  const parsed = {}

  for (const key in el) {
    if (el[key]) {
      switch (key) {
        case 'changed':
        case 'paidTill':
        case 'created':
          parsed[key] = new Date(el[key] * 1000)
          break

        case 'startDate':
        case 'endDate':
        case 'date':
          parsed[key] = parseDate(el[key])
          break

        // case 'parent':
        //   if (typeof el[key] === 'string') {
        //     // this is Tag
        //     if (!tag[el[key]]) {
        //       // Tag not parsed yet
        //       tag[el[key]] = { id: el[key] }
        //     }
        //     parsed[key] = tag[el[key]]
        //   } else {
        //     // this is User
        //     if (!user[el[key]]) {
        //       // User not parsed yet
        //       user[el[key]] = {}
        //     }
        //     parsed[key] = user[el[key]]
        //   }
        //   break

        case 'currency':
        case 'instrument':
        case 'incomeInstrument':
        case 'outcomeInstrument':
        case 'opIncomeInstrument':
        case 'opOutcomeInstrument':
          parsed[key] = instrument[el[key]]
          break

        case 'country':
          parsed[key] = country[el[key]]
          break

        case 'user':
          parsed[key] = user[el[key]]
          break

        case 'company':
          parsed[key] = company[el[key]]
          break

        case 'incomeAccount':
        case 'outcomeAccount':
          parsed[key] = account[el[key]]
          break

        case 'tag':
          if (typeof el[key] === 'string') {
            parsed[key] = [tag[el[key]]]
          } else {
            parsed[key] = el[key].map(tagId => tag[tagId])
          }
          break

        case 'merchant':
          parsed[key] = merchant[el[key]]
          break

        case 'reminder':
          parsed[key] = reminder[el[key]]
          break

        case 'reminderMarker':
          parsed[key] = reminderMarker[el[key]]
          break

        default:
          break
      }
    }
  }

  if (el.hasOwnProperty('latitude')) {
    if (el.income && el.outcome) {
      parsed.type = 'transfer'
    } else {
      parsed.type = el.income ? 'income' : 'outcome'
    }
  }
  return { ...el, ...parsed }
}

export const checkTransaction = conditions => tr => {
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
