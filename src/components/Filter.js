import React, { Component } from 'react'
import styled from 'styled-components'
import FilterTags from './FilterTags'
import TagSelect from 'containers/TagSelect'
import { Checkbox, Input, Form, Icon, Drawer, Tooltip, Radio } from 'antd'

const Search = Input.Search
const InputGroup = Input.Group

const StyledForm = styled(Form)`
  width: 100%;
  padding: 0;
`
export default class Filter extends Component {
  state = { isDrawerVisible: false }

  handleTypeChange = e => {
    const value = e.target.value
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
                style={{ color: 'var(--color-accent)', cursor: 'pointer' }}
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
              <Radio.Group
                buttonStyle="solid"
                value={conditions.type || 'all'}
                onChange={this.handleTypeChange}
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
