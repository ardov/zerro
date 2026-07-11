import {
  DataEntity,
  ZERRO_DATA_ACCOUNT_NAME,
  createZerroEngine,
  createZerroSession,
  type TCoreContext,
  type TDataStore,
  type TNormalizedPatch,
} from 'core-next'

declare const data: TDataStore
declare const ctx: TCoreContext
declare const patch: TNormalizedPatch

const session = createZerroSession(data, ctx)
const engine = createZerroEngine({ base: data, ctx })

session.envelopes.getAll()
engine.executeCompiled({ type: 'consumer.check' }, patch)

void DataEntity.Account
void ZERRO_DATA_ACCOUNT_NAME
