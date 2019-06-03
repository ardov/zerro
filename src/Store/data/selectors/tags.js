import toArray from 'lodash/toArray'
import createSelector from 'selectorator'
import { getUsersById } from './users'
import { unsignedToRGB } from '../../../Utils/convertColor'

export const normalize = ({ users }, raw) => ({
  id: raw.id,
  user: users[raw.user],
  changed: raw.changed * 1000,
  icon: raw.icon,
  budgetIncome: raw.budgetIncome,
  budgetOutcome: raw.budgetOutcome,
  required: raw.required,
  color: raw.color ? unsignedToRGB(raw.color) : null,
  picture: raw.picture,
  showIncome: raw.showIncome,
  showOutcome: raw.showOutcome,
  parent: raw.parent,

  fullTitle: raw.title,
  title: getTitle(raw.title),
  symbol: toArray(raw.title)[0]
})

export const getTagsById = createSelector(
  [getUsersById, 'data.tag'],
  (users, tags) => {
    const result = {}
    for (const id in tags) {
      result[id] = normalize({ users }, tags[id])
    }
    return result
  }
)

export const getTagsTree = createSelector(
  [getTagsById],
  tags => {
    const list = []
    for (const id in tags) {
      list.push(tags[id])
    }
    const topLevel = list.filter(tag => !tag.parent)
    list
      .filter(tag => tag.parent)
      .forEach(tag => {
        const parent = topLevel.find(topTag => topTag.id === tag.parent)
        if (parent.children) {
          parent.children.push(tag)
        } else {
          parent.children = [tag]
        }
      })

    return topLevel
  }
)

export const getTag = (state, id) => getTagsById(state)[id]

//

function getTitle(title) {
  const titleArr = toArray(title)
  if (isEmoji(titleArr[0])) {
    titleArr.shift()
    return titleArr.join('').trim()
  }
  return title
}

function isEmoji(str) {
  const regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
  return str.match(regex)
}
