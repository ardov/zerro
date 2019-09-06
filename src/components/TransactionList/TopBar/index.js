import React from 'react'
import styled from 'styled-components'
import Filter from './Filter'

const SearchContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 3;
  /* width: 100%; */
  padding: 24px 16px 0;
  background-color: #fff;
  box-shadow: 0 16px 16px #fff;
`
const FilterWrapper = styled.div`
  position: relative;
  max-width: 560px;
  margin: 0 auto;
`

export default function TopBar({ style }) {
  return (
    <SearchContainer style={style}>
      <FilterWrapper>
        <Filter />
      </FilterWrapper>
    </SearchContainer>
  )
}
