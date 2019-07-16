const populate = ({ instruments }, raw) => ({
  id: raw.id,
  user: raw.user,
  instrument: instruments[raw.instrument],
  type: raw.type,
  role: raw.role,
  private: raw.private,
  savings: raw.savings,
  title: raw.title,
  inBalance: raw.inBalance,
  creditLimit: raw.creditLimit,
  startBalance: raw.startBalance,
  balance: raw.balance,
  // "company": 4902,
  archive: raw.archive,
  enableCorrection: raw.enableCorrection,
  // startDate: null,
  // capitalization: null,
  // percent: null,
  changed: raw.changed,
  // syncID: ['3314', '8603', '9622'],
  // enableSMS: false,
  // endDateOffset: null,
  // endDateOffsetInterval: null,
  // payoffStep: null,
  // payoffInterval: null
})

export default populate
