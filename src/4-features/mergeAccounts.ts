import { TAccountId } from '6-shared/types'
import { AppThunk } from 'store'
import { mergeAccounts as mergeAccountsCommand } from 'core-next/adapters/redux'

/**
 * Deletes an account and moves all its transactions to another one.
 * @param source account to be deleted
 * @param target account where transactions move (must share the currency)
 */
export const mergeAccounts =
  (source: TAccountId, target: TAccountId): AppThunk =>
  dispatch =>
    dispatch(mergeAccountsCommand(source, target))
