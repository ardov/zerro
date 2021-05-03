import React, { FC } from 'react'
import { Helmet } from 'react-helmet'

/* Need this component because MDX changes Helmet children and raw Helmet doesn't work */
export const Head: FC<{
  title: string
  description?: string
  canonical?: string
}> = props => {
  return (
    <Helmet>
      <title>{props.title}</title>
      {props.description && (
        <meta name="description" content={props.description} />
      )}
      {props.canonical && <link rel="canonical" href={props.canonical} />}
    </Helmet>
  )
}
