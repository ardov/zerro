import React, { FC } from 'react'
import { makeStyles } from '@material-ui/styles'
import { Typography } from '@material-ui/core'
import { TransactionType, Transaction } from 'types'
import { useSelector } from 'react-redux'
import { getPopulatedTags } from 'store/localData/tags'

const useStyles = makeStyles(theme => ({
  tag: {
    '&:not(:first-child)': {
      marginLeft: theme.spacing(2),
      color: theme.palette.text.hint,
    },
  },
}))

interface MainLineProps {
  type: TransactionType
  tag: Transaction['tag']
}

export const MainLine: FC<MainLineProps> = ({ type, tag }) => {
  const c = useStyles()
  const tags = useSelector(getPopulatedTags)

  if (type === 'transfer') return <Typography noWrap>Перевод</Typography>
  if (!tag) return <Typography noWrap>Без категории</Typography>
  return (
    <Typography noWrap>
      {tag.map(tag => (
        <span className={c.tag} key={tag}>
          {tags[tag]?.name}
        </span>
      ))}
    </Typography>
  )
}
