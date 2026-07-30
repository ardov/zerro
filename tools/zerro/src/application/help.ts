import { readFileSync } from 'node:fs'

import { getShapeFields, successShapes } from './shapes'
import { ToolError, success, type TMeta } from './output'

type TOptionType = 'string' | 'integer' | 'boolean' | 'enum'

type TOptionSpec = {
  name: string
  type: TOptionType
  values?: readonly string[]
  default?: string | number | boolean
  description: string
}

type TPrerequisite = string | TOptionSpec

function opt(
  name: string,
  type: TOptionType,
  description: string,
  extra: {
    values?: readonly string[]
    default?: string | number | boolean
  } = {}
): TOptionSpec {
  return { name, type, description, ...extra }
}

const LIMIT = opt('--limit', 'integer', 'Max rows per page.', { default: 50 })
const CURSOR = opt(
  '--cursor',
  'string',
  "Opaque pagination cursor copied from the previous page's nextCursor."
)
const FIELDS = opt(
  '--fields',
  'string',
  'Comma-separated dot-paths to project the response down to, e.g. "items.name,items.totalConverted". A path that matches nothing produces a warning rather than an error.'
)
const FORMAT = opt(
  '--format',
  'enum',
  'tsv renders data.items as a tab-separated table; nested objects and currency vectors are JSON-stringified into their cell rather than fanned out into columns.',
  { values: ['json', 'tsv'], default: 'json' }
)
const QUERY = opt(
  '--query',
  'string',
  'Case-insensitive substring filter on title/name.'
)
const DISPLAY_CURRENCY = opt(
  '--display-currency',
  'string',
  'Currency code (e.g. RUB, USD) to add a converted single-number field alongside the by-currency vector.'
)
const FROM_DATE = opt('--from', 'string', 'Inclusive start date (YYYY-MM-DD).')
const TO_DATE = opt('--to', 'string', 'Inclusive end date (YYYY-MM-DD).')
const MONTH_FLAG = opt('--month', 'string', 'Month to read (YYYY-MM).')

const commands = [
  {
    name: 'help',
    effect: 'none',
    required: [],
    optional: [
      opt(
        '--shape',
        'string',
        'Print field docs for one successShape instead of the command manifest.'
      ),
    ],
    example: 'pnpm zerro help --shape monthSummary',
    successShape: 'commandManifest',
    errors: ['INVALID_INPUT'],
  },
  {
    name: 'version',
    effect: 'none',
    required: [],
    optional: [],
    example: 'pnpm zerro version',
    successShape: 'versionInfo',
    errors: [],
  },
  {
    name: 'status',
    effect: 'none',
    required: [],
    optional: [],
    example: 'pnpm zerro status',
    successShape: 'localStatus',
    errors: ['INVALID_STATE', 'ENDPOINT_MISMATCH'],
  },
  {
    name: 'refresh',
    effect: 'local',
    required: ['ZM_TOKEN'],
    optional: [],
    example: 'ZM_TOKEN=... pnpm zerro refresh',
    successShape: 'refreshReceipt',
    errors: [
      'TOKEN_REQUIRED',
      'NETWORK_FAILURE',
      'ZENMONEY_REJECTED',
      'INVALID_ZENMONEY_RESPONSE',
      'INVALID_STATE',
    ],
  },
  {
    name: 'sync',
    effect: 'remote',
    required: ['ZM_TOKEN when outbox is non-empty'],
    optional: [],
    example: 'ZM_TOKEN=... pnpm zerro sync',
    successShape: 'syncReceipt',
    errors: [
      'TOKEN_REQUIRED',
      'NETWORK_FAILURE',
      'ZENMONEY_REJECTED',
      'INVALID_ZENMONEY_RESPONSE',
      'OUTBOX_NO_TRANSPORT',
      'INVALID_STATE',
    ],
  },
  {
    name: 'accounts list',
    effect: 'none',
    required: [],
    optional: [
      opt('--include-archived', 'boolean', 'Include archived accounts.', {
        default: false,
      }),
      DISPLAY_CURRENCY,
      LIMIT,
      CURSOR,
      FIELDS,
      FORMAT,
    ],
    example: 'pnpm zerro accounts list --limit 50',
    successShape: 'accountPage',
    errors: ['INVALID_INPUT', 'INVALID_CURSOR', 'INVALID_STATE'],
  },
  {
    name: 'tags search',
    effect: 'none',
    required: [],
    optional: [QUERY, LIMIT, CURSOR, FIELDS, FORMAT],
    example: 'pnpm zerro tags search --query food',
    successShape: 'tagPage',
    errors: ['INVALID_INPUT', 'INVALID_CURSOR', 'INVALID_STATE'],
  },
  {
    name: 'merchants search',
    effect: 'none',
    required: [],
    optional: [QUERY, LIMIT, CURSOR, FIELDS, FORMAT],
    example: 'pnpm zerro merchants search --query amazon',
    successShape: 'merchantPage',
    errors: ['INVALID_INPUT', 'INVALID_CURSOR', 'INVALID_STATE'],
  },
  {
    name: 'transactions search',
    effect: 'none',
    required: [],
    optional: [
      QUERY,
      FROM_DATE,
      TO_DATE,
      opt(
        '--account',
        'string',
        'Account id or exact title, case-insensitive. A miss lists matching candidates instead of guessing.'
      ),
      opt(
        '--tag',
        'string',
        'Comma-separated tag ids or exact titles. A transaction matches if any of its tags is in the list.'
      ),
      opt(
        '--merchant',
        'string',
        'Comma-separated merchant ids or exact titles.'
      ),
      opt('--type', 'enum', 'Comma-separated transaction types to include.', {
        values: ['income', 'outcome', 'transfer', 'debt'],
      }),
      DISPLAY_CURRENCY,
      LIMIT,
      CURSOR,
      FIELDS,
      FORMAT,
    ],
    example: 'pnpm zerro transactions search --from 2026-07-01 --to 2026-07-31',
    successShape: 'transactionPage',
    errors: [
      'INVALID_INPUT',
      'ENTITY_NOT_FOUND',
      'INVALID_CURSOR',
      'INVALID_STATE',
    ],
  },
  {
    name: 'month get',
    effect: 'none',
    required: ['month'],
    optional: [DISPLAY_CURRENCY, FIELDS],
    example: 'pnpm zerro month get 2026-07',
    successShape: 'monthSummary',
    errors: [
      'INVALID_INPUT',
      'STATE_NOT_INITIALIZED',
      'MONTH_NOT_FOUND',
      'INVALID_STATE',
    ],
  },
  {
    name: 'months list',
    effect: 'none',
    required: [],
    optional: [
      FROM_DATE,
      TO_DATE,
      LIMIT,
      CURSOR,
      DISPLAY_CURRENCY,
      FIELDS,
      FORMAT,
    ],
    example: 'pnpm zerro months list --from 2026-01 --to 2026-07',
    successShape: 'monthPage',
    errors: [
      'INVALID_INPUT',
      'STATE_NOT_INITIALIZED',
      'INVALID_CURSOR',
      'INVALID_STATE',
    ],
  },
  {
    name: 'envelopes list',
    effect: 'none',
    required: [MONTH_FLAG],
    optional: [
      QUERY,
      LIMIT,
      CURSOR,
      opt('--roots-only', 'boolean', 'Only top-level envelopes, no children.', {
        default: false,
      }),
      DISPLAY_CURRENCY,
      FIELDS,
      FORMAT,
    ],
    example: 'pnpm zerro envelopes list --month 2026-07',
    successShape: 'envelopePage',
    errors: [
      'INVALID_INPUT',
      'STATE_NOT_INITIALIZED',
      'MONTH_NOT_FOUND',
      'INVALID_CURSOR',
      'INVALID_STATE',
    ],
  },
  {
    name: 'envelopes get',
    effect: 'none',
    required: ['envelopeId', MONTH_FLAG],
    optional: [DISPLAY_CURRENCY, FIELDS],
    example: 'pnpm zerro envelopes get tag#food --month 2026-07',
    successShape: 'envelope',
    errors: [
      'INVALID_INPUT',
      'STATE_NOT_INITIALIZED',
      'ENTITY_NOT_FOUND',
      'MONTH_NOT_FOUND',
      'INVALID_STATE',
    ],
  },
  {
    name: 'goals list',
    effect: 'none',
    required: [MONTH_FLAG],
    optional: [QUERY, LIMIT, CURSOR, DISPLAY_CURRENCY, FIELDS, FORMAT],
    example: 'pnpm zerro goals list --month 2026-07',
    successShape: 'goalPage',
    errors: [
      'INVALID_INPUT',
      'STATE_NOT_INITIALIZED',
      'MONTH_NOT_FOUND',
      'INVALID_CURSOR',
      'INVALID_STATE',
    ],
  },
  {
    name: 'debtors list',
    effect: 'none',
    required: [],
    optional: [QUERY, LIMIT, CURSOR, FIELDS, FORMAT],
    example: 'pnpm zerro debtors list --limit 50',
    successShape: 'debtorPage',
    errors: [
      'INVALID_INPUT',
      'STATE_NOT_INITIALIZED',
      'INVALID_CURSOR',
      'INVALID_STATE',
    ],
  },
  {
    name: 'report activity',
    effect: 'none',
    required: [
      opt('--group-by', 'enum', 'Aggregation dimension.', {
        values: ['tag', 'merchant', 'account', 'month'],
      }),
    ],
    optional: [
      FROM_DATE,
      TO_DATE,
      opt(
        '--direction',
        'enum',
        "net (default) nets refunds against spending per the envelope's keepIncome flag and excludes general income; outcome/income report one gross side only. See `help --shape reportPage` for the sign convention.",
        { values: ['net', 'outcome', 'income'], default: 'net' }
      ),
      DISPLAY_CURRENCY,
      LIMIT,
      CURSOR,
      FIELDS,
      FORMAT,
    ],
    example:
      'pnpm zerro report activity --group-by tag --from 2026-07-01 --to 2026-07-31',
    successShape: 'reportPage',
    errors: [
      'INVALID_INPUT',
      'STATE_NOT_INITIALIZED',
      'INVALID_CURSOR',
      'INVALID_STATE',
    ],
  },
  {
    name: 'budget preview-set',
    effect: 'none',
    required: [opt('--input', 'string', 'Path to a JSON request file.')],
    optional: [],
    example: 'pnpm zerro budget preview-set --input budgets.json',
    successShape: 'budgetPreview',
    errors: [
      'INVALID_INPUT',
      'INPUT_READ_FAILED',
      'STATE_NOT_INITIALIZED',
      'MONTH_NOT_FOUND',
      'ENTITY_NOT_FOUND',
      'CURRENCY_MISMATCH',
      'NO_CHANGES',
      'INVALID_STATE',
    ],
  },
  {
    name: 'budget stage-set',
    effect: 'local',
    required: [
      opt(
        '--request-id',
        'string',
        'Caller-chosen idempotency key for this write.'
      ),
      opt('--input', 'string', 'Path to a JSON request file.'),
    ],
    optional: [],
    example:
      'pnpm zerro budget stage-set --request-id july-food-1 --input budgets.json',
    successShape: 'budgetStageReceipt',
    errors: [
      'INVALID_REQUEST_ID',
      'INVALID_INPUT',
      'INPUT_READ_FAILED',
      'IDEMPOTENCY_CONFLICT',
      'STATE_NOT_INITIALIZED',
      'MONTH_NOT_FOUND',
      'ENTITY_NOT_FOUND',
      'CURRENCY_MISMATCH',
      'NO_CHANGES',
      'STATE_WRITE_FAILED',
      'INVALID_STATE',
    ],
  },
  {
    name: 'outbox list',
    effect: 'none',
    required: [],
    optional: [LIMIT, CURSOR, FIELDS, FORMAT],
    example: 'pnpm zerro outbox list',
    successShape: 'outboxPage',
    errors: ['INVALID_INPUT', 'INVALID_CURSOR', 'INVALID_STATE'],
  },
  {
    name: 'outbox undo',
    effect: 'local',
    required: [
      opt('--request-id', 'string', 'Idempotency key of the undo itself.'),
    ],
    optional: [],
    example: 'pnpm zerro outbox undo --request-id undo-july-food-1',
    successShape: 'undoReceipt',
    errors: [
      'INVALID_REQUEST_ID',
      'IDEMPOTENCY_CONFLICT',
      'OUTBOX_EMPTY',
      'STATE_WRITE_FAILED',
      'INVALID_STATE',
    ],
  },
  {
    name: 'transaction preview-create',
    effect: 'none',
    required: [opt('--input', 'string', 'Path to a JSON request file.')],
    optional: [],
    example: 'pnpm zerro transaction preview-create --input expense.json',
    successShape: 'transactionPreview',
    errors: [
      'INVALID_INPUT',
      'INPUT_READ_FAILED',
      'STATE_NOT_INITIALIZED',
      'ENTITY_NOT_FOUND',
      'INVALID_STATE',
    ],
  },
  {
    name: 'transaction stage-create',
    effect: 'local',
    required: [
      opt(
        '--request-id',
        'string',
        'Caller-chosen idempotency key for this write.'
      ),
      opt('--input', 'string', 'Path to a JSON request file.'),
    ],
    optional: [],
    example:
      'pnpm zerro transaction stage-create --request-id groceries-1 --input expense.json',
    successShape: 'transactionStageReceipt',
    errors: [
      'INVALID_REQUEST_ID',
      'INVALID_INPUT',
      'INPUT_READ_FAILED',
      'IDEMPOTENCY_CONFLICT',
      'STATE_NOT_INITIALIZED',
      'ENTITY_NOT_FOUND',
      'STATE_WRITE_FAILED',
      'INVALID_STATE',
    ],
  },
] satisfies ReadonlyArray<{
  name: string
  effect: 'none' | 'local' | 'remote'
  required: readonly TPrerequisite[]
  optional: readonly TOptionSpec[]
  example: string
  successShape: string
  errors: readonly string[]
}>

const guide = {
  fieldReference:
    'pnpm zerro help --shape <name> prints one-line docs for every field of that response, keyed by dot-path (e.g. "items[].total"). See successShapes below for valid names.',
  successShapes: Object.keys(successShapes).sort(),
  tableOutput:
    '--format tsv renders data.items as a tab-separated table. Combine with --fields to pick columns, e.g. --fields items.name,items.totalConverted --format tsv.',
  quietOutput:
    "pnpm prints its own banner before the command's JSON on stdout. Run pnpm with -s (pnpm -s zerro ...) for JSON-only output, or always read the last line.",
  multiCurrency:
    'Most amounts are vectors of {CURRENCY: amount}, not a single number, since accounts span multiple currencies. Pass --display-currency <CODE> to also get one converted number alongside the vector.',
  warnings:
    'A response can carry a top-level "warnings" array (code, message, entityIds) next to "ok": true — it flags a partial or approximate result (e.g. an unmatched --fields path, or transactions with more than one tag) without failing the command.',
  shellGotcha:
    'In zsh/bash, `echo "$json" | jq` corrupts any value containing a literal newline, because echo unescapes \\n before jq sees it. Use `printf \'%s\' "$json" | jq` instead.',
}

export function getHelp(meta: TMeta) {
  return success('help', 'none', meta, {
    commands,
    defaults: { limit: 50, maximumLimit: 200 },
    guide,
  })
}

export function getVersion(meta: TMeta) {
  const packageJsonUrl = new URL('../../../../package.json', import.meta.url)
  const pkg = JSON.parse(readFileSync(packageJsonUrl, 'utf8')) as {
    version?: string
  }
  return success('version', 'none', meta, {
    version: pkg.version ?? '0.0.0',
  })
}

export function getHelpShape(meta: TMeta, shape: string) {
  const fields = getShapeFields(shape)
  if (!fields)
    throw new ToolError(
      'help',
      'none',
      'INVALID_INPUT',
      `Unknown --shape "${shape}"; run "pnpm zerro help" for the list of successShape names`,
      2,
      { shape }
    )
  return success('help', 'none', meta, { shape, fields })
}
