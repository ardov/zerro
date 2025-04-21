import React, { FC, useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { ListChildComponentProps, VariableSizeList } from 'react-window'
import {
  StaticDatePicker,
  StaticDatePickerProps,
} from '@mui/x-date-pickers/StaticDatePicker'
import AutoSizer, { VerticalSize } from 'react-virtualized-auto-sizer'
import { ListSubheader, Box, Typography } from '@mui/material'
import { formatDate, parseDate } from '6-shared/helpers/date'
import { TDateDraft, TISODate, TTransaction } from '6-shared/types'
import { toISODate } from '6-shared/helpers/date'
import { SmartDialog } from '6-shared/ui/SmartDialog'
import { registerPopover } from '6-shared/historyPopovers'
import { trModel, TrType } from '5-entities/transaction'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { instrumentModel } from '5-entities/currency/instrument'
import { accountModel } from '5-entities/account'
import { useTranslation } from 'react-i18next'

type GroupNode = {
  date: TISODate
  transactions: JSX.Element[]
  rawTransactions?: TTransaction[]
}

const HEADER_HEIGHT = 48
const TRANSACTION_HEIGHT = 72

const findDateIndex = (groups: GroupNode[], date: GroupNode['date']) => {
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].date <= date) return i
  }
  return groups.length - 1
}

type GrouppedListProps = {
  groups: GroupNode[]
  initialDate?: TDateDraft
}

export const GrouppedList: FC<GrouppedListProps> = props => {
  const { groups, initialDate } = props
  const listRef = useRef<VariableSizeList>(null)
  const datePopover = dateDialog.useMethods()

  useEffect(() => {
    listRef?.current?.resetAfterIndex?.(0)
  }, [listRef, groups])

  const scrollToDate = useCallback(
    (date: TDateDraft) => {
      const idx = findDateIndex(groups, toISODate(date))
      listRef?.current?.scrollToItem(idx, 'start')
    },
    [groups]
  )

  const onDateClick = useCallback(
    (date: TISODate) => {
      datePopover.open({
        value: parseDate(date),
        minDate: parseDate(groups[groups.length - 1]?.date || 0),
        maxDate: parseDate(groups[0]?.date || 0),
        onChange: d => {
          datePopover.close()
          scrollToDate(d as TISODate)
        },
      })
    },
    [datePopover, groups, scrollToDate]
  )

  // Scroll to initial date if it's provided
  // We should render first and only then scroll.
  // That's why there is a timeout. Downside of is that the list jumps.
  useEffect(() => {
    if (initialDate) setTimeout(() => scrollToDate(initialDate), 10)
  }, [initialDate, scrollToDate])

  return (
    <>
      <DateDialog />
      <AutoSizer disableWidth>
        {(props: VerticalSize) => {
          const { height } = props
          if (!height) return null
          return (
            <VariableSizeList
              className="hidden-scroll"
              width="100%"
              height={height}
              ref={listRef}
              useIsScrolling
              itemCount={groups.length}
              itemData={{ groups, onDateClick }}
              itemKey={i => groups[i].date}
              itemSize={i =>
                HEADER_HEIGHT +
                TRANSACTION_HEIGHT * groups[i].transactions.length
              }
            >
              {Day}
            </VariableSizeList>
          )
        }}
      </AutoSizer>
    </>
  )
}

//
//
//
//
//
//

type DayData = {
  groups: GroupNode[]
  onDateClick: (date: TISODate) => void
}

// Компонент для отображения общей суммы за день
const DayTotal: FC<{ transactions: TTransaction[] }> = ({ transactions }) => {
  const { t } = useTranslation('transaction')
  const toDisplay = displayCurrency.useToDisplay('current')
  const instCodeMap = instrumentModel.useInstCodeMap()
  const debtAccId = accountModel.useDebtAccountId()
  const [showDetails, setShowDetails] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Расчитываем общую сумму за день
  const total = useMemo(() => {
    // Общие суммы по каждому типу транзакций
    let incomeTotal = 0
    let outcomeTotal = 0
    let hasIncome = false
    let hasOutcome = false

    transactions.forEach(tr => {
      const type = trModel.getType(tr, debtAccId)
      const incomeCurrency = instCodeMap[tr.incomeInstrument]
      const outcomeCurrency = instCodeMap[tr.outcomeInstrument]
      
      try {
        switch (type) {
          case TrType.Income:
            const incomeAmount = toDisplay({ [incomeCurrency]: tr.income })
            if (typeof incomeAmount === 'number' && !isNaN(incomeAmount)) {
              incomeTotal += incomeAmount
              hasIncome = true
            }
            break
          case TrType.Outcome:
            const outcomeAmount = toDisplay({ [outcomeCurrency]: tr.outcome })
            if (typeof outcomeAmount === 'number' && !isNaN(outcomeAmount)) {
              outcomeTotal += outcomeAmount
              hasOutcome = true
            }
            break
          // Другие типы транзакций можно обработать по необходимости
        }
      } catch (error) {
        console.error('Error processing transaction', tr.id, error)
      }
    })
    
    // Определяем, какую сумму показывать
    let totalValue;
    let isPositive;
    
    if (hasIncome && !hasOutcome) {
      // Только доходы - показываем сумму доходов
      totalValue = incomeTotal;
      isPositive = true;
    } else if (!hasIncome && hasOutcome) {
      // Только расходы - показываем сумму расходов с минусом
      totalValue = -outcomeTotal;
      isPositive = false;
    } else {
      // Смешанный день - показываем разницу
      totalValue = incomeTotal - outcomeTotal;
      isPositive = totalValue > 0;
    }
    
    return { 
      income: incomeTotal, 
      outcome: outcomeTotal, 
      total: totalValue,
      isPositive,
      hasIncome,
      hasOutcome
    };
  }, [transactions, debtAccId, instCodeMap, toDisplay])

  // Если нет транзакций, ничего не выводим
  if (!transactions?.length) return null
  
  const displayValue = total.total

  // Форматирование суммы для отображения
  let formattedValue = ''
  try {
    if (typeof displayValue === 'number' && !isNaN(displayValue)) {
      if (Math.abs(displayValue) < 0.01) {
        // Если значение очень маленькое, не показываем
        return null
      }
      // Показываем абсолютное значение, знак добавим отдельно
      formattedValue = Math.abs(displayValue).toLocaleString('ru-RU')
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }

  // Форматирование значений дохода и расхода для детального отображения
  const formatIncome = () => {
    if (!total.income) return '0'
    return total.income.toLocaleString('ru-RU')
  }

  const formatOutcome = () => {
    if (!total.outcome) return '0'
    return total.outcome.toLocaleString('ru-RU')
  }

  // Обработчик клика по сумме
  const handleClick = (e: React.MouseEvent) => {
    // Предотвращаем стандартное поведение и всплытие события
    e.preventDefault();
    e.stopPropagation();
    
    // Показываем детали на 3 секунды
    setShowDetails(true);
    setTimeout(() => {
      setShowDetails(false);
    }, 3000);
    
    // Дополнительная проверка, чтобы клик обрабатывался только здесь
    return false;
  }

  // Обработчики тач-событий для мобильных устройств
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setShowDetails(true);
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    // Устанавливаем таймер, чтобы пользователь успел увидеть информацию
    setTimeout(() => {
      setShowDetails(false);
    }, 3000);
  }

  return (
    <div 
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {showDetails || isHovered ? (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {total.hasIncome && (
            <Typography 
              variant="body2" 
              color="success.main"
              title={t('type_income')}
              sx={{ 
                borderRadius: '4px',
                padding: '2px 6px',
                backgroundColor: 'rgba(76, 175, 80, 0.12)'
              }}
            >
              +{formatIncome()}
            </Typography>
          )}
          {total.hasOutcome && (
            <Typography 
              variant="body2" 
              color="error.main"
              title={t('type_outcome')}
              sx={{ 
                borderRadius: '4px',
                padding: '2px 6px',
                backgroundColor: 'rgba(244, 67, 54, 0.12)'
              }}
            >
              -{formatOutcome()}
            </Typography>
          )}
        </Box>
      ) : (
        <Typography 
          variant="body2" 
          color="text.secondary"
          title={t('dailyTotal')}
          sx={{
            borderRadius: '4px',
            padding: '2px 6px'
          }}
        >
          {total.isPositive ? '+' : '-'}{formattedValue}
        </Typography>
      )}
    </div>
  )
}

const Day: FC<ListChildComponentProps<DayData>> = props => {
  const { index, style, data, isScrolling } = props
  const { groups, onDateClick } = data
  const renderContent = useRenderState(isScrolling)
  const date = groups[index].date
  const length = groups[index].transactions.length
  const rawTransactions = groups[index].rawTransactions
  
  // Обработчик клика по дате
  const handleDateClick = (e: React.MouseEvent) => {
    onDateClick(date);
  };
  
  return (
    <div style={{ ...groupStyle, ...style }}>
      <div style={{ position: 'relative' }}>
        <ListSubheader 
          onClick={handleDateClick}
          sx={{ cursor: 'pointer' }}
        >
          {formatDate(date)}
        </ListSubheader>
        
        {/* Абсолютно позиционированный элемент для суммы */}
        <div style={{ 
          position: 'absolute',
          right: '16px',
          top: '14px',
          zIndex: 2
        }}>
          {rawTransactions && <DayTotal transactions={rawTransactions} />}
        </div>
      </div>

      {renderContent ? (
        groups[index].transactions
      ) : (
        <TrSkeleton length={length} />
      )}
    </div>
  )
}

const TrSkeleton = (props: { length: number }) => (
  <div
    style={{
      height: props.length * TRANSACTION_HEIGHT,
      background:
        'radial-gradient(circle at 36px 36px, rgba(128,128,128,0.2) 20px,transparent 20px)',
      backgroundSize: '100% 72px',
    }}
  />
)

/** Used to delay rendering of complex components */
const useRenderState = (isScrolling?: boolean, delay = 300) => {
  const [renderContent, setRenderContent] = useState(!isScrolling)
  useEffect(() => {
    if (!isScrolling) setRenderContent(true)
    let timer = setTimeout(() => setRenderContent(true), delay)
    return () => clearTimeout(timer)
  }, [delay, isScrolling])
  return renderContent
}

const groupStyle: React.CSSProperties = {
  position: 'relative',
  maxWidth: 560,
  marginLeft: 'auto',
  marginRight: 'auto',
}

//
//
//
//
//
//

type TDateDialogProps = {
  value: StaticDatePickerProps<TDateDraft>['value']
  minDate?: StaticDatePickerProps<TDateDraft>['minDate']
  maxDate?: StaticDatePickerProps<TDateDraft>['maxDate']
  onChange: StaticDatePickerProps<TDateDraft>['onChange']
}

const dateDialog = registerPopover<TDateDialogProps>('listSateDialog', {
  value: new Date(),
  onChange: () => {},
})

const DateDialog = () => {
  const { extraProps } = dateDialog.useProps()
  return (
    <SmartDialog elKey={dateDialog.key}>
      <StaticDatePicker
        {...extraProps}
        openTo="day"
        // renderInput={params => <TextField {...params} />}
      />
    </SmartDialog>
  )
}
