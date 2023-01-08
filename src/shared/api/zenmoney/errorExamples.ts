export {}

const noTag = {
  code: 'validationError',
  message:
    'Invalid Relation "Tag" in Object Budget {{budget_id}}. Tag {{tag_id}} Doesn\'t Exist',
  details: {
    object: 'budget',
    objectID: '{{budget_id}}',
    relation: 'tag',
    relationID: '{{tag_id}}',
  },
}

const serverError = {
  code: 'serverError',
  message:
    'Server Inner Error. Try Again After Some Time. if Error Occurs Again Please Connect Zenmoney Support service.',
}

const wrongTimeFormat = {
  code: 'validationError',
  message:
    'Wrong Format of currentClientTimestamp. Please Check Your Local Time',
}

const invalidTransaction = {
  code: 'validationError',
  message:
    'Invalid Object Transaction {{transaction_id}}. Transfer Transaction Must Have Both Income and Outcome Positive',
}

const wrongProperty = {
  code: 'validationError',
  message:
    'Invalid Property "Outcome" in Object Transaction {{transaction_id}}. Wrong Value',
}

const wrongProperty2 = {
  code: 'validationError',
  message:
    'Invalid Property "User" in Object Reminder {{reminder_id}}. Wrong User of Object',
}
