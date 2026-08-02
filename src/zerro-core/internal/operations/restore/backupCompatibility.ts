import {
  AccountType,
  getRootUser,
  type TDataStore,
  type TInstrumentId,
} from '../../domain/zenmoney'

export type TBackupCompatibilityResult =
  | { ok: true }
  | { ok: false; reason: 'incompatibleBackup' | 'invalidCurrentState' }

/**
 * Checks whether a structurally valid full backup can be restored into this
 * account. It deliberately does not compare writable data: restore is meant
 * to change that data. Read-only dictionary identities and root identity must
 * already exist locally instead of being silently adopted from another user.
 */
export function checkBackupCompatibility(
  current: TDataStore,
  backup: TDataStore
): TBackupCompatibilityResult {
  const currentDebtAccounts = Object.values(current.account).filter(
    account => account.type === AccountType.Debt
  )
  if (currentDebtAccounts.length !== 1) {
    return { ok: false, reason: 'invalidCurrentState' }
  }

  const backupDebtAccounts = Object.values(backup.account).filter(
    account => account.type === AccountType.Debt
  )
  if (backupDebtAccounts.length !== 1) {
    return { ok: false, reason: 'incompatibleBackup' }
  }

  const currentRoot = getRootUser(current.user)
  const backupRoot = getRootUser(backup.user)
  if (!currentRoot || !backupRoot || currentRoot.id !== backupRoot.id) {
    return { ok: false, reason: 'incompatibleBackup' }
  }

  const requiredInstruments = new Set<TInstrumentId>([backupRoot.currency])
  const requiredCompanies = new Set<number>()
  const addCompany = (company: number | null) => {
    if (company !== null) requiredCompanies.add(company)
  }
  const addTransferInstruments = (row: {
    incomeInstrument: TInstrumentId
    outcomeInstrument: TInstrumentId
  }) => {
    requiredInstruments.add(row.incomeInstrument)
    requiredInstruments.add(row.outcomeInstrument)
  }

  Object.values(backup.account).forEach(account => {
    requiredInstruments.add(account.instrument)
    addCompany(account.company)
  })
  Object.values(backup.reminder).forEach(addTransferInstruments)
  Object.values(backup.reminderMarker)
    .filter(marker => marker.state !== 'deleted')
    .forEach(addTransferInstruments)
  Object.values(backup.transaction)
    .filter(transaction => !transaction.deleted)
    .forEach(transaction => {
      addTransferInstruments(transaction)
      if (transaction.opIncomeInstrument !== null) {
        requiredInstruments.add(transaction.opIncomeInstrument)
      }
      if (transaction.opOutcomeInstrument !== null) {
        requiredInstruments.add(transaction.opOutcomeInstrument)
      }
    })

  if (
    [...requiredInstruments].some(id => !current.instrument[id]) ||
    [...requiredCompanies].some(id => !current.company[id])
  ) {
    return { ok: false, reason: 'incompatibleBackup' }
  }

  return { ok: true }
}
