import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/** The owned interactive set: Base UI compositions that replaced a MUI
 * control. The point of converting them is that the MUI equivalent can leave,
 * and that only holds while nothing pulls MUI back in through a barrel. */
const OWNED = [
  'src/6-shared/ui/AdaptivePopover.tsx',
  'src/6-shared/ui/ActionList.tsx',
  'src/6-shared/ui/AmountInput.tsx',
  'src/6-shared/ui/Button.tsx',
  'src/6-shared/ui/Checkbox.tsx',
  'src/6-shared/ui/Chip.tsx',
  'src/6-shared/ui/CircularProgress.tsx',
  'src/6-shared/ui/Collapse.tsx',
  'src/6-shared/ui/Dialog.tsx',
  'src/6-shared/ui/FloatingInput.tsx',
  'src/6-shared/ui/GrowingTextarea.tsx',
  'src/6-shared/ui/Menu.tsx',
  'src/6-shared/ui/MultiCombobox.tsx',
  'src/6-shared/ui/InputBase.tsx',
  'src/6-shared/ui/Link.tsx',
  'src/6-shared/ui/OutlinedField.tsx',
  'src/6-shared/ui/Popover.tsx',
  'src/6-shared/ui/Switch.tsx',
  'src/6-shared/ui/Tooltip.tsx',
  'src/6-shared/ui/SideDrawer.tsx',
  'src/6-shared/ui/Select.tsx',
  'src/6-shared/ui/SnackbarNotice.tsx',
  'src/6-shared/ui/SnackbarProvider.tsx',
  'src/6-shared/ui/SmartDialog.tsx',
  'src/6-shared/ui/feather/index.tsx',
  'src/6-shared/hooks/useBreakpointDown.ts',
  'src/6-shared/hooks/useMediaQueryValue.ts',
  'src/6-shared/hooks/useHomeBar.ts',
  'src/6-shared/hooks/useRovingListKeys.ts',
]

/** Surfaces converted off MUI are checked on their own imports rather than a
 * whole transitive closure: an application surface can still use shared
 * infrastructure while that infrastructure is being migrated separately. */
const CONVERTED = [
  'src/2-pages/Budgets/BudgetPopover/BudgetPopover.tsx',
  'src/2-pages/Budgets/MonthInfo/FxRates.tsx',
  'src/2-pages/Budgets/GoalPopover/GoalPopover.tsx',
  'src/2-pages/Budgets/GoalPopover/Context.tsx',
  'src/6-shared/ui/ColorPickerPopover/index.tsx',
  'src/6-shared/ui/MonthSelectPopover.tsx',
  'src/3-widgets/Navigation/NavDrawer.tsx',
  'src/3-widgets/Navigation/index.tsx',
  'src/3-widgets/transaction/TagSelect/TagSelect2.tsx',
  'src/3-widgets/DebtorList/index.tsx',
  'src/3-widgets/DebtorList/components.tsx',
  'src/3-widgets/account/AccountList/components.tsx',
  'src/2-pages/Budgets/EnvelopePreview/EnvelopeInfo.tsx',
  'src/2-pages/Budgets/EnvelopeTable/Parent.tsx',
  'src/2-pages/Budgets/EnvelopeTable/NewGroup.tsx',
  'src/2-pages/Budgets/MonthInfo/ActivityStats/ActivityStats.tsx',
  'src/2-pages/Stats/WidgetAccHistory/WidgetAccHistory.tsx',
  'src/3-widgets/account/AccountList/index.tsx',
  'src/3-widgets/DataLine.tsx',
  'src/3-widgets/History/HistoryControls.tsx',
  'src/3-widgets/History/HistoryRowList.tsx',
  'src/3-widgets/transaction/TagSelect/TagChip.tsx',
  'src/3-widgets/transaction/TransactionPreview/Reciept.tsx',
  'src/2-pages/Donation.tsx',
  'src/2-pages/Review/cards/IncomeCard/NotFunFact.tsx',
  'src/2-pages/Review/cards/IncomeCard/IncomeCard.tsx',
  'src/4-features/moveMoney/MoveMoneyModal.tsx',
  'src/1-app/App.tsx',
  'src/2-pages/Budgets/EnvelopeEditDialog/EnvelopeEditDialog.tsx',
  'src/2-pages/Budgets/EnvelopePreview/CommentWidget.tsx',
  'src/2-pages/Review/cards/NotFunCard/NotFunCard.tsx',
  'src/2-pages/Stats/WidgetNetWorth/WidgetNetWorth.tsx',
  'src/2-pages/Budgets/EnvelopeTable/Header/MonthSelect.tsx',
  'src/3-widgets/transaction/TransactionList/TopBar/BulkEditModal.tsx',
  'src/4-features/import/ImportBackupItem.tsx',
  'src/6-shared/ui/SmartConfirm.tsx',
  'src/3-widgets/PersistenceWarningNotice.tsx',
  'src/3-widgets/OutboxRecoveryNotice.tsx',
  'src/3-widgets/JournalRecoveryNotice.tsx',
  'src/3-widgets/History/RestoredOutboxNotice.tsx',
  'src/3-widgets/transaction/TransactionList/TopBar/Filter.tsx',
  'src/3-widgets/Navigation/MobileNavigation.tsx',
  'src/3-widgets/RefreshButton.tsx',
  'src/3-widgets/transaction/TransactionList/GrouppedList.tsx',
]

/** The mixed barrel. It re-exports the MUI-free Feather set alongside the
 * three glyphs still taken from `@mui/icons-material`, so importing a Feather
 * glyph through it drags MUI in with no visible sign at the call site. */
const MIXED_ICON_BARREL = '6-shared/ui/Icons'

const SRC = resolve(process.cwd(), 'src')
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']
const IS_CODE = /\.(tsx?|jsx?)$/
const SPECIFIER =
  /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*['"]([^'"]+)['"]/g

/** Bare specifiers resolve against `src` because tsconfig maps `*` there. */
function resolveModule(specifier: string, from: string) {
  const base = specifier.startsWith('.')
    ? resolve(dirname(from), specifier)
    : join(SRC, specifier)
  if (existsSync(base) && statSync(base).isFile()) {
    return IS_CODE.test(base) ? base : null
  }
  for (const extension of EXTENSIONS) {
    if (existsSync(base + extension)) return base + extension
  }
  for (const extension of EXTENSIONS) {
    const index = join(base, `index${extension}`)
    if (existsSync(index)) return index
  }
  return null
}

const specifiersOf = (file: string) =>
  [...readFileSync(file, 'utf8').matchAll(SPECIFIER)].map(
    match => match[1] || match[2] || match[3]
  )

const relative = (file: string) => file.replace(`${process.cwd()}/`, '')

/** Every `@mui/*` specifier reachable from `entries`, each with the shortest
 * import chain that reaches it, so a failure names the file to fix. */
function findMui(entries: string[]) {
  const seen = new Set<string>()
  const found: string[] = []

  const walk = (file: string, trail: string[]) => {
    if (seen.has(file)) return
    seen.add(file)
    for (const specifier of specifiersOf(file)) {
      if (specifier.startsWith('@mui')) {
        found.push(
          `${specifier} via ${[...trail, relative(file)].join(' -> ')}`
        )
        continue
      }
      const target = resolveModule(specifier, file)
      if (target) walk(target, [...trail, relative(file)])
    }
  }

  entries.forEach(entry => walk(resolve(process.cwd(), entry), []))
  return found
}

describe('owned components stay off MUI', () => {
  it('has no MUI anywhere in the owned set, however deep', () => {
    expect(findMui(OWNED.map(file => resolve(process.cwd(), file)))).toEqual([])
  })

  it('imports Feather glyphs from the MUI-free module, not the mixed barrel', () => {
    const offenders = [...OWNED, ...CONVERTED].filter(file =>
      specifiersOf(resolve(process.cwd(), file)).some(specifier =>
        specifier.endsWith(MIXED_ICON_BARREL)
      )
    )
    expect(offenders).toEqual([])
  })

  it('keeps the converted surfaces free of direct MUI imports', () => {
    const offenders = CONVERTED.flatMap(file =>
      specifiersOf(resolve(process.cwd(), file))
        .filter(specifier => specifier.startsWith('@mui'))
        .map(specifier => `${file}: ${specifier}`)
    )
    expect(offenders).toEqual([])
  })
})
