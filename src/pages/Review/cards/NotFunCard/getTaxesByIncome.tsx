/** Source https://journal.tinkoff.ru/fns-loves-you/ */
import { round } from '@shared/helpers/money'

const ruIncomeTaxes = [
  {
    type: 'income',
    name: 'Пенсионные взносы',
    rate: 0.22,
    comment: 'Работадатель платит в пенсионный фонд 22% от зарплаты.',
  },
  { type: 'income', name: 'НДФЛ', rate: 0.13, comment: 'Подоходный налог 13%' },
  {
    type: 'income',
    name: 'Медицинское страхование',
    rate: 0.051,
    comment: '5.1% от вашей зарплаты уходит на оплату полиса ОМС.',
  },
  {
    type: 'income',
    name: 'Социальное страхование',
    rate: 0.029,
    comment: '2,9% от зарплаты уходят на больничные, декретные и т. д.',
  },
  {
    type: 'income',
    name: 'Взнос в случае травм на работе',
    rate: 0.002,
    comment:
      'Примерно 0.2% уходит на страховку от травм на работе. Процент зависит от рискованности работы.',
  },
]

const ruOutcomeTaxes = [
  {
    type: 'outcome',
    name: 'НДС',
    rate: 0.125,
    comment:
      'Налог на добавленную стоимость, его можно найти в чеках. Варьируется от 10% до 20%. Здесь используется средняя ставка 12.5%.',
  },
  {
    type: 'outcome',
    name: 'Налоги компаний',
    rate: 0.024,
    comment:
      'Компании закладывают свои налоги в стоимость товаров. Это примерно 2.4% от стоимости.',
  },
]

export function getTaxes(income: number, outcome: number) {
  const rawSalary = income / 0.87
  return [
    ...ruIncomeTaxes.map(t => ({
      value: round(rawSalary * t.rate),
      ...t,
    })),
    ...ruOutcomeTaxes.map(t => ({
      value: round(outcome * t.rate),
      ...t,
    })),
  ]
}
