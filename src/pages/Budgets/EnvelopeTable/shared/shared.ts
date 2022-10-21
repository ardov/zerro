import { Box, styled, SxProps } from '@mui/system'

export const rowStyle: SxProps = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'auto 90px 16px',
    sm: 'auto 90px 90px 90px 16px',
  },
  width: '100%',
  px: 2,
  alignItems: 'center',
  justifyContent: 'initial',
  gridColumnGap: '12px',
}

export const SRowWrapper = styled(Box)`
  display: grid;
  grid-template-columns: auto 90px 90px 90px 16px;
  width: 100%;
  padding: 0px 16px;
  align-items: center;
  justify-content: initial;
  grid-column-gap: 12px;
`
