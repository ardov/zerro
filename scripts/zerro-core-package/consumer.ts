import {
  ZERRO_DATA_ACCOUNT_NAME,
  createZerroSession,
  type TCoreContext,
  type TDataEntityKey,
  type TDataStore,
} from 'zerro-core'

declare const data: TDataStore
declare const ctx: TCoreContext

const session = createZerroSession(data, ctx)

session.envelopes.getAll()

const dataEntity: TDataEntityKey = 'account'
void dataEntity
void ZERRO_DATA_ACCOUNT_NAME
