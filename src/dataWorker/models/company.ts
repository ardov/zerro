import { ById, TCompany, ZmCompany } from '../types'
import { unixToISO } from './utils'

function convertCompany(raw: ZmCompany): TCompany {
  return {
    ...raw,
    changed: unixToISO(raw.changed),
  }
}

export function processCompanies(companies: ById<ZmCompany>): ById<TCompany> {
  return Object.fromEntries(
    Object.entries(companies).map(([id, raw]) => [id, convertCompany(raw)])
  )
}
