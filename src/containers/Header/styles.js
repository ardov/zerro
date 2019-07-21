import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Button } from 'antd'

export const Main = styled.header`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 40px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
`

export const Name = styled.h1`
  margin: 0;
  padding: 0;
  font-weight: 400;
  font-size: 20px;
`

export const Buttons = styled.div`
  justify-self: flex-end;
`

export const NavLink = styled(Link)`
  margin-left: 16px;
`

export const StyledButton = styled(Button)`
  margin-left: 16px;
`
