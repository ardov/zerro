import React from 'react'
import styled, { css } from 'styled-components'
import Checkbox from '@material-ui/core/Checkbox'

const Body = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-top: -8px;
  margin-right: 16px;
`
const StyledCheckbox = styled(Checkbox)`
  opacity: 0;

  ${Body}:hover & {
    opacity: 1;
  }

  ${props =>
    props.isInSelectionMode &&
    css`
      opacity: 1;
    `}
`

const Sym = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  color: ${({ color }) => (color ? color : `var(--text-primary)`)};
  font-size: 24px;
  line-height: 40px;
  text-align: center;
  border-radius: 20px;

  ${Body}:hover & {
    display: none;
  }
`
export default function Icon({
  isChecked,
  isInSelectionMode,
  symbol,
  color,
  onToggle,
}) {
  const handleChange = e => {
    e.stopPropagation()
    onToggle()
  }

  return (
    <Body>
      <StyledCheckbox
        isInSelectionMode={isInSelectionMode}
        checked={isChecked}
        onChange={handleChange}
        color="primary"
      />
      {!isInSelectionMode && <Sym color={color}>{symbol}</Sym>}
    </Body>
  )
}
