import React from 'react'
import { connect } from 'react-redux'
import { TreeSelect } from 'antd'
import { getTagsTree } from 'store/data/tags'

function TagSelect(props) {
  const treeData = props.tags.map(tag => {
    const children = tag.children
      ? tag.children.map(child => {
          return { title: child.fullTitle, value: child.id, key: child.id }
        })
      : undefined
    return {
      title: tag.fullTitle,
      value: tag.id,
      key: tag.id,
      children: children,
    }
  })

  return (
    <TreeSelect
      className={props.className}
      treeData={treeData}
      showSearch
      style={{ display: 'block' }}
      value={props.value}
      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
      placeholder="Выберите категории"
      allowClear
      multiple={!props.single}
      treeDefaultExpandAll
      filterTreeNode={(str, el) => {
        return el.props.title.toUpperCase().includes(str.toUpperCase())
      }}
      onChange={props.onChange}
      {...props}
    />
  )
}

export default connect(
  state => ({ tags: getTagsTree(state) }),
  null
)(TagSelect)
