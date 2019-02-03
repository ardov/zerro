import React from 'react'
import { connect } from 'react-redux'
import { TreeSelect } from 'antd'
import { getTags } from '../store/selectors'

function TagSelect(props) {
  if (!props.tags.map) debugger
  const treeData = props.tags.map(tag => {
    const children = tag.children
      ? tag.children.map(child => {
          return { title: child.title, value: child.id, key: child.id }
        })
      : undefined
    return {
      title: tag.title,
      value: tag.id,
      key: tag.id,
      children: children
    }
  })

  return (
    <TreeSelect
      treeData={treeData}
      showSearch
      style={{ display: 'block' }}
      value={props.value}
      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
      placeholder="Выберите категории"
      allowClear
      multiple
      treeDefaultExpandAll
      filterTreeNode={(str, el) => {
        return el.props.title.toUpperCase().includes(str.toUpperCase())
      }}
      onChange={props.onChange}
    />
  )
}

const mapStateToProps = state => ({
  tags: getTags(state)()
})

export default connect(
  mapStateToProps,
  null
)(TagSelect)
