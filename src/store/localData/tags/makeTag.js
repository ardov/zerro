import { v1 as uuidv1 } from 'uuid'

export default function makeTag(raw) {
  return {
    id: raw.id === null ? null : raw.id || uuidv1(),
    changed: raw.changed || Date.now(),
    user: raw.user,
    title: raw.title,
    icon: raw.icon || null,
    budgetIncome: raw.budgetIncome || false,
    budgetOutcome: raw.budgetOutcome || false,
    required: raw.required || false,
    color: raw.color || null,
    picture: raw.picture || null,
    showIncome: raw.showIncome || false,
    showOutcome: raw.showOutcome || false,
    parent: raw.parent || null,
  }
}

export const nullTag = makeTag({
  title: 'Без категории',
  id: null,
  budgetIncome: true,
  budgetOutcome: true,
})
