export function arrayMove<T>(
  arr: Array<T>,
  fromIndex: number,
  toIndex: number
) {
  const element = arr[fromIndex]
  arr.splice(fromIndex, 1)
  arr.splice(toIndex, 0, element)
}
