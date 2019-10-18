import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { Typography } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  tag: {
    '&:not(:first-child)': {
      marginLeft: theme.spacing(2),
      color: theme.palette.text.hint,
    },
  },
}))

export const MainLine = ({ type, tag }) => {
  const c = useStyles()
  return type === 'transfer' ? (
    <Typography noWrap>Перевод</Typography>
  ) : tag ? (
    <Typography noWrap>
      {tag.map(tag => (
        <span className={c.tag} key={tag.id}>
          {tag.name}
        </span>
      ))}
    </Typography>
  ) : (
    <Typography noWrap>Без категории</Typography>
  )
}
