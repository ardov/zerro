import { createSelector } from '@reduxjs/toolkit'
import { useEffect, useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { safeLocalStorage } from '@/6-shared/api/browserStorage'
import { zenmoney } from '@/6-shared/api/zenmoney'
import { usePopup, type SurfaceController } from '@/6-shared/overlays'
import { useOverlayState } from '@/6-shared/overlays/context'
import { Button } from '@/6-shared/ui/kit/Button'
import { DialogSurface } from '@/6-shared/ui/kit/Dialog'
import type { TAccount } from '@/6-shared/types'
import { AccountIcon } from './account/AccountIcon'
import { useAppSelector, type RootState } from '@/store'
import { ZERRO_DATA_ACCOUNT_NAME } from '@/zerro-core/constants'
import { getRootUserId } from '@/zerro-core/replica'
import { core } from '@/zerro-core/redux'
import './ZerroDataAccountNotice.css'

type PreviewAccount = Pick<TAccount, 'id' | 'title' | 'type' | 'company'>

const selectPreviewAccounts = createSelector(
  [(state: RootState) => state.data.current.account],
  accounts =>
    Object.values(accounts)
      .filter(
        account =>
          !account.archive &&
          account.type !== 'debt' &&
          account.title.trim() &&
          !core.accounts.isZerroDataAccount(account)
      )
      .slice(0, 2)
)

const selectDataAccount = createSelector(
  [
    (state: RootState) => state.token,
    (state: RootState) => state.data.current.user,
    (state: RootState) => state.data.current.account,
    (state: RootState) => state.data.base.account,
  ],
  (token, users, accounts, baseAccounts) => {
    if (!token || token === zenmoney.fakeToken) return null
    const userId = getRootUserId(users)
    const account = Object.values(accounts).find(
      core.accounts.isZerroDataAccount
    )
    if (userId === null || !account) return null
    return { userId, createdLocally: !baseAccounts[account.id] }
  }
)

/** Explain a locally created storage account, never one loaded from Zenmoney
 * or a historical preview. The local flag must not itself create hidden data. */
export function ZerroDataAccountNotice() {
  const account = useAppSelector(selectDataAccount)
  const previewAccounts = useAppSelector(selectPreviewAccounts)
  const pendingUser = useRef<number | null>(null)
  const popup = usePopup()
  const { open, setOpen, release } = popup
  const { live } = useOverlayState()

  useEffect(() => release, [release])

  useEffect(() => {
    if (!account) {
      pendingUser.current = null
      release()
      return
    }
    const key = `zerro:data-account-notice:${account.userId}`
    if (open) {
      safeLocalStorage.setItem(key, 'shown')
      pendingUser.current = null
      return
    }
    if (safeLocalStorage.getItem(key)) {
      pendingUser.current = null
      return
    }
    if (account.createdLocally) pendingUser.current = account.userId
    // Let the editor/confirmation that caused the write finish first. Keep
    // the pending notice even if sync accepts the account in the meantime.
    if (pendingUser.current !== account.userId || live.length) return
    pendingUser.current = null
    setOpen(true)
  }, [account, live.length, open, release, setOpen])

  return (
    <ZerroDataAccountDialog controller={popup} accounts={previewAccounts} />
  )
}

export function ZerroDataAccountDialog({
  controller,
  accounts = [],
}: {
  controller: SurfaceController
  accounts?: PreviewAccount[]
}) {
  const { t } = useTranslation('dataAccount')
  const descriptionId = useId()
  return (
    <DialogSurface
      label={t('title')}
      controller={controller}
      closeButton={false}
      contentClassName="p-0"
      aria-describedby={descriptionId}
    >
      <div
        className="zerro-data-account-illustration"
        role="img"
        aria-label={t('previewLabel', { account: ZERRO_DATA_ACCOUNT_NAME })}
      >
        <div className="zerro-data-account-list" aria-hidden>
          {[0, 1].map(index => {
            const account = accounts[index]
            return (
              <div
                key={index}
                className="zerro-data-account-row zerro-data-account-existing"
              >
                <span className="zerro-data-account-icon">
                  <AccountIcon account={account} />
                </span>
                {account ? (
                  <span className="truncate">{account.title}</span>
                ) : (
                  <span className="zerro-data-account-placeholder" />
                )}
              </div>
            )
          })}
          <div className="zerro-data-account-row zerro-data-account-new">
            <span className="zerro-data-account-icon text-ui-24">🤖</span>
            <span className="truncate font-medium">
              {ZERRO_DATA_ACCOUNT_NAME.replace('🤖 ', '')}
            </span>
          </div>
        </div>
      </div>
      <div className="px-6 pt-3 pb-6">
        <h2 className="text-ui-20 font-medium text-balance">{t('title')}</h2>
        <div id={descriptionId} className="mt-3 space-y-3 text-ui-secondary">
          <p className="text-balance">{t('keep')}</p>
          <p className="text-balance">{t('description')}</p>
        </div>
        <Button
          className="mt-6 w-full"
          variant="primary"
          onClick={() => controller.setOpen(false)}
        >
          {t('understood')}
        </Button>
      </div>
    </DialogSurface>
  )
}
