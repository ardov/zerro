import { unsignedToRGB } from 'helpers/convertColor'
import toArray from 'lodash/toArray'
import iconsMap from './iconsMap'

export default class Tag {
  constructor(raw) {
    this.id = raw.id || null
    this.user = raw.user || null
    this.changed = raw.changed || 0
    this.icon = raw.icon || null
    this.budgetIncome = raw.budgetIncome || true
    this.budgetOutcome = raw.budgetOutcome || true
    this.required = raw.required || false
    this.color = raw.color || null
    this.picture = raw.picture || null
    this.showIncome = raw.showIncome || false
    this.showOutcome = raw.showOutcome || false
    this.parent = raw.parent || null
    this.title = raw.title || '!!!'

    // COMPUTED
    this.goal = getGoal(raw.title)
    this.name = getName(raw.title)
    this.symbol = iconsMap[raw.icon] || raw.title.slice(0, 2)
    this.colorRGB = raw.color ? unsignedToRGB(raw.color) : null
  }

  static nullTag = new Tag({
    id: null,
    user: null,
    changed: 0,
    icon: null,
    budgetIncome: true,
    budgetOutcome: true,
    required: false,
    color: null,
    picture: null,
    showIncome: false,
    showOutcome: false,
    parent: null,
    title: 'Без категории',
    goal: null,
  })
}

function getName(title) {
  let name = title
  if (getGoal(name)) {
    name = name.replace(getGoal(name).match, '')
  }

  const titleArr = toArray(name)
  if (isEmoji(titleArr[0])) {
    titleArr.shift()
    return titleArr.join('').trim()
  }
  return name
}

function isEmoji(str) {
  const regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
  return str.match(regex)
}

function getGoal(str) {
  const regexes = {
    // Авто *5000/м
    monthly: {
      main: s => s.match(/\*\d*\/м$/),
      amount: s => +s.match(/(?<=\*)\d*/)[0], // "*5000/м" -> 5000
    },

    // Новый компьютер *5000
    target: {
      main: s => s.match(/\*\d*$/),
      amount: s => +s.match(/(?<=\*)\d*/)[0], // "*5000" -> 5000
    },

    // Отпуск *5000-11.19
    targetByDate: {
      main: s => s.match(/\*\d*-\d*.\d*$/),
      amount: s => +s.match(/(?<=\*)\d*/)[0], // "*5000-11.19" -> 5000
      date: s =>
        new Date(
          +s.match(/(?<=\.)\d*/)[0] + 2000, // "*5000-11.19" -> 2019
          +s.match(/(?<=-)\d*/)[0] - 1 // "*5000-11.19" -> 10
        ),
    },
  }

  // Monthly
  if (regexes.monthly.main(str)) {
    return {
      type: 'monthly',
      amount: regexes.monthly.amount(str),
      match: regexes.monthly.main(str)[0],
    }
  }

  // Target
  if (regexes.target.main(str)) {
    return {
      type: 'target',
      amount: regexes.target.amount(str),
      match: regexes.target.main(str)[0],
    }
  }

  // Target by date
  if (regexes.targetByDate.main(str)) {
    return {
      type: 'targetByDate',
      amount: regexes.targetByDate.amount(str),
      date: regexes.targetByDate.date(str),
      match: regexes.targetByDate.main(str)[0],
    }
  }

  return null
}

// Goal tests
// console.log('Авто *5000/м ->', getGoal('Авто *5000/м'))
// console.log('Новый компьютер *5000 ->', getGoal('Новый компьютер *5000'))
// console.log('Отпуск *5000-11.19 ->', getGoal('Отпуск *5000-11.19'))
