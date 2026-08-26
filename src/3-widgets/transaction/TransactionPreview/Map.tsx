import type { FC } from 'react'
import clsx from 'clsx'
import styled from '@emotion/styled'

interface MapProps {
  longitude?: number | null
  latitude?: number | null
  className?: string
}

export const Map: FC<MapProps> = ({ longitude, latitude, className }) => {
  if (!(longitude && latitude)) return null

  return (
    <div
      className={clsx(
        'surface-card shadow-elevation-1 overflow-hidden',
        className
      )}
    >
      <StyledIframe
        title="geo"
        src={`https://www.google.com/maps/embed?pb=!1m10!1m8!1m3!1d1040.2885062361672!2d${longitude}!3d${latitude}!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sru!2sru!4v1546784599411`}
        width="200"
        height="200"
        frameBorder="0"
        loading="lazy"
        allowFullScreen
      />
    </div>
  )
}

const StyledIframe = styled.iframe`
  width: 100%;
  margin-bottom: -4px;
`
