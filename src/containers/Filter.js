import { connect } from 'react-redux'
import {
  setCondition,
  setTags,
  getFilterConditions
} from '../store/filterConditions'
import Filter from '../components/Filter'

const mapStateToProps = state => ({
  conditions: getFilterConditions(state)
})

const mapDispatchToProps = dispatch => ({
  setCondition: condition => dispatch(setCondition(condition)),
  setTags: tags => dispatch(setTags(tags))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Filter)
