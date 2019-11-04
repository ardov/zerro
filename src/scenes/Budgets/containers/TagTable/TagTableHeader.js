import React from 'react'
import { Typography, Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles(theme => ({
  row: {
    display: 'grid',
    width: '100%',
    gridTemplateColumns: 'auto 120px 120px 120px',
    alignItems: 'center',
    gridColumnGap: theme.spacing(4),
  },
}))

export default function TagTableHeader(props) {
  const c = useStyles()

  return (
    <Box p={2} pl={9.5} width="100%" className={c.row} {...props}>
      <Typography variant="body2" color="textSecondary" noWrap>
        Категория
      </Typography>

      <Typography variant="body2" color="textSecondary" align="right" noWrap>
        Бюджет
      </Typography>

      <Typography variant="body2" color="textSecondary" align="right" noWrap>
        Потрачено
      </Typography>

      <Typography variant="body2" color="textSecondary" align="right" noWrap>
        Остаток
      </Typography>
    </Box>
  )
}
