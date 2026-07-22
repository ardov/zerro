import type { FC } from 'react'

export const Head: FC<{
  title: string
  description?: string
  canonical?: string
}> = props => {
  return (
    <>
      <title>{props.title}</title>
      {props.description && (
        <meta name="description" content={props.description} />
      )}
      {props.canonical && <link rel="canonical" href={props.canonical} />}
    </>
  )
}
