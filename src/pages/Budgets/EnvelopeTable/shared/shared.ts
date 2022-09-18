import { SxProps } from '@mui/system'

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

export enum Metric {
  budgeted = 'budgeted',
  outcome = 'outcome',
  available = 'available',
}
