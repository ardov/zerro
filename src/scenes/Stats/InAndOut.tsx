import React from 'react'
import { useSelector } from 'react-redux'
import {
    Paper,
    Card,
    Typography,
  } from '@mui/material'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts'
import { DataLine } from 'components/DataLine'
import { getTransactions } from 'store/localData/transactions'
import { round } from 'helpers/currencyHelpers'
import { formatDate, formatMoney } from 'helpers/format'

const startDate = new Date(2019, 0)

const months = new Array();
var nowDate = new Date();
//nowDate.setMonth(nowDate.getMonth());
var currDate = startDate;
currDate = new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate())
while (currDate < nowDate){
    months.push({
        date: new Date(currDate), 
        dateStr: formatDate(currDate, 'LLLL yyyy'),
        in: 0, 
        out: 0
    });
    currDate.setMonth(currDate.getMonth()+1);
}
//console.log(months);

export function InAndOut() {
      const data = useSelector(getTransactions);
        for (var row in data){
            const date = new Date(data[row]['date']);
            for (var d in months){
                if(!data[row]['deleted'] &&   // remove deleted
                   (data[row]['income'] === 0 || data[row]['outcome'] === 0) &&  // remove transfer between accounts
                    date.getMonth() === months[d]['date'].getMonth() &&
                    date.getFullYear() === months[d]['date'].getFullYear()) {
                        months[d]['in'] = round(months[d]['in'] + data[row]['income']);
                        months[d]['out'] = round(months[d]['out'] + data[row]['outcome']);
                }
            }
    }

    /*type TPayload = {
        // chartType: undefined
        color: string
        dataKey: string
        fill: string
        // formatter: undefined
        name: string
        payload: array
        // type: undefined
        // unit: undefined
        value: number
      }*/
          
    return (
        <Paper>
            <ResponsiveContainer height={300}>
            <AreaChart data = {months}>
                <defs>
                    <linearGradient id="areaIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="green" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="green" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="areaOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="red" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="red" stopOpacity={0.1} />
                    </linearGradient>
                </defs>
                <Area dataKey="in" stroke="green" fill="url(#areaIn)" />
                <Area dataKey="out" stroke="red" fill="url(#areaOut)" />
                <XAxis dataKey="dateStr"  style={{fontSize: '0.6rem'}} />
                <YAxis dataKey="in" tickFormatter={(number) => formatMoney(number)} style={{fontSize: '0.6rem'}} />
                <Tooltip content={<CustomTooltip />} />
                <CartesianGrid opacity={0.5} vertical={false} />
            </AreaChart>
            </ResponsiveContainer>
        </Paper>
      );
  };

  const CustomTooltip = (props: any) => {
    const payload = props.payload
    const active = props.active as boolean
    if (!active || !payload?.length) return null
    console.log(props);
    return (
        <Card elevation={10} sx={{ p: 2 }}>
          <Typography variant="h6">
            {payload[0].payload.dateStr}
          </Typography>
            <DataLine
              color='green'
              key={2}
              name={'Доход'}
              amount={payload[0].payload.in}
              instrument="user"
            />
            <DataLine
              color='red'
              key={2}
              name={'Расход'}
              amount={payload[0].payload.out}
              instrument="user"
            />
            <DataLine
              color='black'
              key={2}
              name={'Чистый доход'}
              amount={payload[0].payload.in - payload[0].payload.out}
              instrument="user"
            />
          <Typography>
              {'Расход '} {formatMoney(payload[0].payload.out / payload[0].payload.in * 100)}{'%'}
          </Typography>

        </Card>
    );
}

