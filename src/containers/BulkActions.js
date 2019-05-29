import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { getSelectedIds } from '../store/selectedTransactions'
import {
  setMainTagToTransactions,
  deleteTransactions
} from '../store/data/thunks'
import { Button } from 'antd'
import TagSelect from './TagSelect'

const Num = styled.h3`
  text-align: center;
  padding-bottom: 4px;
`

const StyledButton = styled(Button)`
  margin-top: 16px;
`

class BulkActions extends React.Component {
  onSetTag = tagId => {
    this.props.setTag(this.props.selectedIds, tagId)
  }
  onDelete = () => {
    this.props.delete(this.props.selectedIds)
  }

  render() {
    if (!this.props.selectedIds.length) return null
    return (
      <div className={this.props.className}>
        <Num>Выбрано: {this.props.selectedIds.length}</Num>
        <TagSelect
          single
          onChange={this.onSetTag}
          placeholder="Выставить категорию"
        />
        <StyledButton type="danger" block onClick={this.onDelete}>
          Удалить выбранные({this.props.selectedIds.length})
        </StyledButton>
      </div>
    )
  }
}

const mapDispatchToProps = dispatch => ({
  setTag: (ids, tagId) => dispatch(setMainTagToTransactions(ids, tagId)),
  delete: ids => dispatch(deleteTransactions(ids))
})

export default connect(
  state => ({ selectedIds: getSelectedIds(state) }),
  mapDispatchToProps
)(BulkActions)
