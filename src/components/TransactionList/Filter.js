import React, { Component } from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import {
  setCondition,
  setTags,
  getFilterConditions,
} from 'store/filterConditions'
import TagSelect from 'components/TagSelect'
import { Checkbox, Input, Form, Icon, Drawer, Tooltip, Radio } from 'antd'

const Search = Input.Search
const InputGroup = Input.Group

const StyledForm = styled(Form)`
  width: 100%;
  padding: 0;
`
class Filter extends Component {
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

  clear = () =>
    this.props.setCondition({ search: '' })

  render() {
    const { conditions = {}, className } = this.props

    return (
      <div className={className}>
        <Input
          value={conditions.search}
          suffix={
            (
              <div>
                {conditions.search
                  ?
                <Tooltip title="Очистить">
                  <Icon
                    type="close"
                    style={{ color: 'var(--color-accent)', cursor: 'pointer', marginRight: '6px' }}
                    onClick={this.clear}
                  />
                </Tooltip>
                  : null
                }
                <Tooltip title="Расширенные фильтры">
                  <Icon
                  type="filter"
                  style={{ color: 'var(--color-accent)', cursor: 'pointer' }}
                  onClick={this.toggleDrawer}
                  />
                </Tooltip>
              </div>
            )
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
      </div>
    )
  }
}

const mapStateToProps = state => ({
  conditions: getFilterConditions(state),
})

const mapDispatchToProps = dispatch => ({
  setCondition: condition => dispatch(setCondition(condition)),
  setTags: tags => dispatch(setTags(tags)),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Filter)
