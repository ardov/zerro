import uuidv1 from 'uuid/v1'

export default function createTransaction(raw) {
  return {
    id: raw.id || uuidv1(),
    changed: raw.changed || Date.now(),
    created: raw.created || Date.now(),
    user: raw.user,
    deleted: raw.deleted || false,
    hold: raw.hold || false,
    viewed: raw.viewed || false,

    qrCode: raw.qrCode || null,

    income: raw.income || 0,
    incomeInstrument: raw.incomeInstrument || null,
    incomeAccount: raw.incomeAccount || null,
    incomeBankID: raw.incomeBankID || null,

    outcome: raw.outcome || 0,
    outcomeInstrument: raw.outcomeInstrument || null,
    outcomeAccount: raw.outcomeAccount || null,
    outcomeBankID: raw.outcomeBankID || null,

    opIncome: raw.opIncome || 0,
    opIncomeInstrument: raw.opIncomeInstrument || null,
    opOutcome: raw.opOutcome || 0,
    opOutcomeInstrument: raw.opOutcomeInstrument || null,

    tag: raw.tag || null,
    date: raw.date,
    comment: raw.comment || null,
    payee: raw.payee || null,
    originalPayee: raw.originalPayee || null,
    merchant: raw.merchant || null,
    latitude: raw.latitude || null,
    longitude: raw.longitude || null,
    reminderMarker: raw.reminderMarker || null,
  }
}
