import React from 'react'
import { Box, Paper } from '@material-ui/core'

export default function Map({ longitude, latitude, ...rest }) {
  if (!(longitude && latitude)) return null

  return (
    <Box overflow="hidden" {...rest} clone>
      <Paper>
        <Box width="100%" marginBottom="-4px" clone>
          <iframe
            title="geo"
            src={`https://www.google.com/maps/embed?pb=!1m10!1m8!1m3!1d1040.2885062361672!2d${longitude}!3d${latitude}!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sru!2sru!4v1546784599411`}
            width="200"
            height="200"
            frameBorder="0"
            allowFullScreen
          />
        </Box>
      </Paper>
    </Box>
  )
}
