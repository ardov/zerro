export const round = (amount: number): number => Math.round(amount * 100) / 100

export function add(...params: number[]): number {
  return params.reduce((acc, cur) => round(acc + cur), 0)
}

export function sub(first: number, ...params: number[]): number {
  return params.reduce((acc, cur) => round(acc - cur), first)
}
