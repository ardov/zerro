import React from 'react'

import styled from 'styled-components'

import TagSelect from 'components/TagSelect'
import { Checkbox, Input, Form } from 'antd'
import Drawer from '@material-ui/core/Drawer'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormHelperText from '@material-ui/core/FormHelperText'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormControl from '@material-ui/core/FormControl'
import FormLabel from '@material-ui/core/FormLabel'

const Search = Input.Search
const InputGroup = Input.Group

const StyledForm = styled(Form)`
  width: 100%;
  padding: 40px;
`
export default function FilterDrawer({
  conditions = {},
  setCondition,
  setTags,
  onClose,
  open,
  ...rest
}) {
  const handleTypeChange = e => {
    const value = e.target.value
    if (value === 'all') {
      setCondition({ type: null })
    } else {
      setCondition({ type: value })
    }
  }

  return (
    <Drawer anchor="right" onClose={onClose} open={open} {...rest}>
      <StyledForm>
        <Form.Item label="">
          <Search
            value={conditions.search}
            placeholder="Поиск по комментариям"
            onChange={e => setCondition({ search: e.target.value })}
          />
        </Form.Item>

        <Form.Item label="">
          <TagSelect value={conditions.tags} onChange={setTags} />
        </Form.Item>

        <Form.Item label="">
          <InputGroup style={{ display: 'flex' }}>
            <Input
              style={{ flexGrow: 1 }}
              placeholder="Сумма от"
              value={conditions.amountFrom}
              onChange={e => setCondition({ amountFrom: +e.target.value })}
            />
            <Input
              style={{ flexGrow: 1, borderLeft: 0 }}
              placeholder="Сумма до"
              value={conditions.amountTo}
              onChange={e => setCondition({ amountTo: +e.target.value })}
            />
          </InputGroup>
        </Form.Item>

        <Form.Item label="">
          <RadioGroup
            value={conditions.type || 'all'}
            onChange={handleTypeChange}
          >
            <FormControlLabel value="all" control={<Radio />} label="Все" />
            <FormControlLabel
              value="income"
              control={<Radio />}
              label="Доход"
            />
            <FormControlLabel
              value="outcome"
              control={<Radio />}
              label="Расход"
            />
            <FormControlLabel
              value="transfer"
              control={<Radio />}
              label="Перевод"
            />
          </RadioGroup>
        </Form.Item>

        <Form.Item label="">
          <Checkbox
            checked={conditions.showDeleted}
            onChange={e => setCondition({ showDeleted: e.target.checked })}
          >
            Показывать удалённые
          </Checkbox>
        </Form.Item>
      </StyledForm>
    </Drawer>
  )
}
