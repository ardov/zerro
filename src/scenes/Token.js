import React from 'react'
import {Box, Button, Typography} from '@material-ui/core'
import { getToken } from 'store/token'
import { useSelector} from "react-redux";

export default function Token() {
  const token = useSelector(state => getToken(state))
  const [tokenIsVisible, setTokenVisibility] = React.useState(false)

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      height="inherit"
    >
      <Box p={5} mx="auto" maxWidth={500}>
        <Typography variant="h4" paragraph>
          Внимание!
        </Typography>

        <Typography variant="body1" paragraph>
          Токен нельзя сделать недействительным и никогда не устаревает!

          Будьте аккуратны! )
        </Typography>

        <Box mt={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setTokenVisibility(!tokenIsVisible)}
          >
            { tokenIsVisible ? "Скрыть токен" : "Показать токен" }
          </Button>
        </Box>

        { tokenIsVisible ? <h3>{token}</h3> : null }
      </Box>
    </Box>
  )
}
