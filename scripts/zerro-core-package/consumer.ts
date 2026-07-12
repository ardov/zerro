import {
  DataEntity,
  ZERRO_DATA_ACCOUNT_NAME,
  createZerroSession,
  type TCoreContext,
  type TDataStore,
} from 'zerro-core'

declare const data: TDataStore
declare const ctx: TCoreContext

const session = createZerroSession(data, ctx)

session.envelopes.getAll()

void DataEntity.Account
void ZERRO_DATA_ACCOUNT_NAME
