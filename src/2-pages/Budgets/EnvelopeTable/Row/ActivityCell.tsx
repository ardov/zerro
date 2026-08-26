import type { FC } from 'react'
import React from 'react'
import { clsx } from 'clsx'
import { Amount } from '6-shared/ui/Amount'
import { Btn } from './Btn'

type ActivityCellProps = {
  value: number
  onClick: React.MouseEventHandler<HTMLButtonElement>
}

export const ActivityCell: FC<ActivityCellProps> = props => {
  const { value: displayActivity, onClick } = props
  return (
    <div
      className={clsx(
        'flex justify-end',
        displayActivity ? 'text-foreground' : 'text-disabled-foreground'
      )}
    >
      <Btn onClick={onClick}>
        <p className="m-0 text-right type-body">
          <Amount value={displayActivity} decimals="ifOnly" />
        </p>
      </Btn>
    </div>
  )
}
