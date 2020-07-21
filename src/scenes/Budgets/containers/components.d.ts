export function Amount(props: {
  value: number
  currency?: string
  sign?: boolean
  noShade?: boolean
  decimals?: number
  decMode?: 'always' | 'ifOnly' | 'ifAny'
  intProps?: any
  decProps?: any
})

export function Total(props: {
  name: string
  value: number
  currency?: string
  sign?: boolean
  [x: string]: any
})
