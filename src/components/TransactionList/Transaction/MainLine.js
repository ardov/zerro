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
  return (
    <Typography noWrap>
      {type === 'transfer'
        ? 'Перевод'
        : tag
        ? tag.map(tag => (
            <span className={c.tag} key={tag.id}>
              {tag.name}
            </span>
          ))
        : 'Без категории'}
    </Typography>
  )
}
