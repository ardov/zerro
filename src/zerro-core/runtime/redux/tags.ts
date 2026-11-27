export { presentTags, type TTagPopulated } from './tagPresentation'
export { getColorForString } from '../presentation/colors'
import { weakMapMemoize } from '@reduxjs/toolkit'
import { useTranslation } from 'react-i18next'
import { i18n } from '@/6-shared/localization'
import { useAppSelector, type RootState } from '@/store'
import { selectData } from './state'
import { presentTags } from './tagPresentation'

export const selectAll = (state: RootState) => selectData(state).tag
const populatedTags = weakMapMemoize(presentTags)
export const selectPopulated = (state: RootState) =>
  populatedTags(selectAll(state), i18n.language)

export function usePopulated() {
  const { i18n } = useTranslation()
  return populatedTags(useAppSelector(selectAll), i18n.language)
}
