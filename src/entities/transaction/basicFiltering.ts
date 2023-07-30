/**
 * Defines a condition for a key in an object or array.
 * The condition can be an exact value, or one of several comparison operators.
 */
export type KeyCondition =
  | number
  | string
  | boolean
  | null
  | {
      eq?: number | string | boolean | null
      neq?: number | string | boolean | null
      gt?: number | string
      gte?: number | string
      lt?: number | string
      lte?: number | string
      contains?: string
      or?: KeyCondition[]
    }

export type StringCondition<T extends string> =
  | T
  | null
  | {
      eq?: T | null
      neq?: T | null
      gt?: T
      gte?: T
      lt?: T
      lte?: T
      contains?: T
      or?: StringCondition<T>[]
    }

/**
 * Checks if a value matches a given condition.
 * @param value The value to check.
 * @param condition The condition to check against.
 * @returns `true` if the value matches the condition, `false` otherwise.
 */
export function checkValue(
  value: any,
  condition?: KeyCondition | StringCondition<string>
): boolean {
  // Undefined condition matches any value.
  if (condition === undefined) return true

  // If the condition is a simple value, check if it matches the value.
  if (typeof condition !== 'object' || condition === null) {
    return condition === value
  }

  // If the condition is an object, check each comparison operator in turn.
  if (condition.eq !== undefined && condition.eq !== value) return false
  if (condition.neq !== undefined && condition.neq === value) return false
  if (condition.gt !== undefined && value <= condition.gt) return false
  if (condition.gte !== undefined && value < condition.gte) return false
  if (condition.lt !== undefined && value >= condition.lt) return false
  if (condition.lte !== undefined && value > condition.lte) return false
  if (condition.contains !== undefined) {
    if (!String(value).includes(condition.contains)) return false
  }
  if (condition.or !== undefined) {
    if (!condition.or.some(c => checkValue(value, c))) return false
  }

  // If none of the comparison operators failed, the value matches the condition.
  return true
}
