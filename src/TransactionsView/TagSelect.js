import React from 'react'
import { TreeSelect } from 'antd'
import { StoreContext } from '../store/'

export default class TagSelect extends React.Component {
  static contextType = StoreContext

  render() {
    const { getTags } = this.context.actions
    const tags = getTags()

    const treeData = tags.map(tag => {
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
        value={this.props.value}
        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
        placeholder="Выберите категории"
        allowClear
        multiple
        treeDefaultExpandAll
        filterTreeNode={(str, el) => {
          return el.props.title.toUpperCase().includes(str.toUpperCase())
        }}
        onChange={this.props.onChange}
      />
    )
  }
}
