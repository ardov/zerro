import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Checkbox, Box } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  checkbox: {
    opacity: props => (props.hover || props.isInSelectionMode ? 1 : 0),
    transition: '.2s',
  },
  symbol: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    color: ({ color }) => (color ? color : theme.palette.text.primary),
    fontSize: '24px',
    lineHeight: '40px',
    textAlign: 'center',
    borderRadius: 20,
    border: ({ color }) => (color ? `1px solid ${color}` : 'none'),
    backgroundColor: theme.palette.action.hover,
    opacity: props => (props.hover || props.isInSelectionMode ? 0 : 1),
    transition: '.2s',
  },
}))

export default function Icon({
  isChecked,
  isInSelectionMode,
  symbol,
  color,
  onToggle,
}) {
  if (color) console.log(color)

  const [hover, setHover] = React.useState(false)
  const c = useStyles({ hover, isInSelectionMode, color })

  const handleChange = e => {
    e.stopPropagation()
    onToggle()
  }
  const handleMouseEnter = () => setHover(true)
  const handleMouseLeave = () => setHover(false)

  return (
    <Box
      position="relative"
      display="flex"
      alignItems="center"
      justifyContent="center"
      mr={2}
      mt="2px" // todo: center normally
      width={40}
      height={40}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Checkbox
        className={c.checkbox}
        checked={isChecked}
        onChange={handleChange}
        color="primary"
      />
      {!isInSelectionMode && !hover && <div className={c.symbol}>{symbol}</div>}
    </Box>
  )
}
