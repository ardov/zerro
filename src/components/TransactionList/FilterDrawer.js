import React from 'react'

import styled from 'styled-components'

import TagSelect from 'components/TagSelect'
import { Checkbox, Input, Form, Radio } from 'antd'
import Drawer from '@material-ui/core/Drawer'

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
          <Radio.Group
            buttonStyle="solid"
            value={conditions.type || 'all'}
            onChange={handleTypeChange}
          >
            <Radio.Button value="all">Все</Radio.Button>
            <Radio.Button value="income">Доход</Radio.Button>
            <Radio.Button value="outcome">Расход</Radio.Button>
            <Radio.Button value="transfer">Перевод</Radio.Button>
          </Radio.Group>
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
