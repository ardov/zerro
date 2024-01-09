import { Stack } from '@mui/material'
import { FC } from 'react'
import { useAppTheme } from '6-shared/ui/theme'
import { round } from '6-shared/helpers/money'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { getTaxes } from './getTaxesByIncome'

type TaxesChartProps = {
  income: number
  outcome: number
}

export const TaxesChart: FC<TaxesChartProps> = ({ income, outcome }) => {
  const theme = useAppTheme()

  let primaryColor = theme.palette.primary.main // theme.palette.success.light
  let taxesColor = theme.palette.error.light

  const taxes = getTaxes(income, outcome).sort((a, b) => b.value - a.value)
  let totalTaxes = taxes.reduce((sum, t) => round(sum + t.value), 0)

  let data = [
    {
      name: 'Ваш доход',
      rate: 0,
      comment: '',
      value: income,
    },
    ...taxes,
  ]

  let dataOutline = [
    {
      name: '💵 ' + Math.round((100 * income) / (income + totalTaxes)) + '%',
      value: income,
    },
    {
      name:
        '🇷🇺 ' + Math.round((100 * totalTaxes) / (income + totalTaxes)) + '%',
      value: totalTaxes,
    },
  ]

  return (
    <Stack direction={'column'} spacing={1} sx={{ width: '100%' }}>
      <ResponsiveContainer height={200} width="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={50}
            outerRadius={70}
            startAngle={90}
            endAngle={-270}
            paddingAngle={0.5}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 0 ? primaryColor : taxesColor}
                stroke={theme.palette.background.default}
                opacity={index < 2 ? 1 : 0.5}
              />
            ))}
          </Pie>
          <Pie
            data={dataOutline}
            innerRadius={75}
            outerRadius={80}
            startAngle={90}
            endAngle={-270}
            paddingAngle={0.5}
            dataKey="value"
            nameKey="name"
            label={e => e.payload.name}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 0 ? primaryColor : taxesColor}
                stroke={theme.palette.background.default}
                opacity={index < 2 ? 1 : 0.5}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </Stack>
  )
}
