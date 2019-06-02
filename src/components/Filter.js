import React, { Component } from 'react'
import styled from 'styled-components'
import FilterTags from './FilterTags'
import TagSelect from '../containers/TagSelect'
import { Checkbox, Input, Form, Icon, Select, Drawer, Tooltip } from 'antd'

const Option = Select.Option
const Search = Input.Search
const InputGroup = Input.Group

const StyledForm = styled(Form)`
  padding: 0;
  max-height: 400px;
  min-width: 360px;
  width: 100%;
`
export default class Filter extends Component {
  state = { isDrawerVisible: false }

  handleTypeChange = value => {
    if (value === 'all') {
      this.props.setCondition({ type: null })
    } else {
      this.props.setCondition({ type: value })
    }
  }

  toggleDrawer = () =>
    this.setState(prev => ({ isDrawerVisible: !prev.isDrawerVisible }))

  render() {
    const conditions = this.props.conditions

    return (
      <div>
        <Input
          value={conditions.search}
          suffix={
            <Tooltip title="Расширенные фильтры">
              <Icon
                type="filter"
                style={{ color: '#1890ff', cursor: 'pointer' }}
                onClick={this.toggleDrawer}
              />
            </Tooltip>
          }
          placeholder="Поиск по комментариям"
          onChange={e => {
            this.props.setCondition({ search: e.target.value })
          }}
        />

        <Drawer
          title="Расширенные фильтры"
          placement="right"
          closable={true}
          width={400}
          onClose={this.toggleDrawer}
          visible={this.state.isDrawerVisible}
        >
          <StyledForm>
            <Form.Item label="">
              <Search
                value={conditions.search}
                placeholder="Поиск по комментариям"
                onChange={e => {
                  this.props.setCondition({ search: e.target.value })
                }}
              />
            </Form.Item>

            <Form.Item label="">
              <TagSelect
                value={conditions.tags}
                onChange={this.props.setTags}
              />
            </Form.Item>

            <Form.Item label="">
              <Select
                value={conditions.type || undefined}
                onChange={this.handleTypeChange}
                placeholder="Доходы, расходы и переводы"
              >
                <Option value="all">Доходы, расходы и переводы</Option>
                <Option value="transfer">Перевод</Option>
                <Option value="income">Доход</Option>
                <Option value="outcome">Расход</Option>
              </Select>
            </Form.Item>

            <Form.Item label="">
              <InputGroup style={{ display: 'flex' }}>
                <Input
                  style={{ flexGrow: 1 }}
                  placeholder="Сумма от"
                  value={conditions.amountFrom}
                  onChange={e => {
                    this.props.setCondition({ amountFrom: +e.target.value })
                  }}
                />
                <Input
                  style={{ flexGrow: 1, borderLeft: 0 }}
                  placeholder="Сумма до"
                  value={conditions.amountTo}
                  onChange={e => {
                    this.props.setCondition({ amountTo: +e.target.value })
                  }}
                />
              </InputGroup>
            </Form.Item>

            <Form.Item label="">
              <Checkbox
                checked={conditions.showDeleted}
                onChange={e => {
                  this.props.setCondition({ showDeleted: e.target.checked })
                }}
              >
                Показывать удалённые
              </Checkbox>
            </Form.Item>
          </StyledForm>
        </Drawer>
        <FilterTags conditions={conditions} />
      </div>
    )
  }
}
