import type { TDataStore } from '../../zenmoney/model/store'
import { ZERRO_DATA_ACCOUNT_NAME } from '../../../../constants'
import type { TCompiled, TCoreContext } from '../../../../types'
import { makeAccount, type TAccountId } from '../../zenmoney/entities/accounts'
import { getRootUser } from '../../zenmoney/entities/users'
import { getZerroDataAccountId } from './read'

export function compileEnsureZerroDataAccount(
  data: TDataStore,
  ctx: TCoreContext
): TCompiled<{ accountId: TAccountId }> {
  const existingId = getZerroDataAccountId(data)
  if (existingId) return { patch: {}, receipt: { accountId: existingId } }

  const user = getRootUser(data)
  if (!user) throw new Error('No root user')

  const account = makeAccount(
    {
      title: ZERRO_DATA_ACCOUNT_NAME,
      user: user.id,
      instrument: user.currency,
    },
    ctx
  )

  return {
    patch: { account: [account] },
    receipt: { accountId: account.id },
  }
}
