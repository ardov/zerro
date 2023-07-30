/*

 0 group
 1 - parent
 2 - - child 1
 3 - - child 2
 4 - - child 3
 5 - parent
 6 - - child 1
 7 group
 8 - parent
 9 - - child 1
10 - - child 2
11 - - child 3
12 - parent
13 - - child 1
14 - - child 2
15 - - child 3

*/
export function arrayMove<T>(
  arr: Array<T>,
  fromIndex: number,
  toIndex: number
) {
  var element = arr[fromIndex]
  arr.splice(fromIndex, 1)
  arr.splice(toIndex, 0, element)
}
