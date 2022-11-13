import React, { useEffect } from 'react'
import { Box } from '@mui/material'
import { useRegisterSW } from 'virtual:pwa-register/react'

const pageOpened = Date.now()

// TODO: use prompt to update service worker (now it's just draft)
export const SWPrompt = () => {
  const {
    updateServiceWorker,
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log(`Service Worker at: ${swUrl}`)

      // r &&
      //   setInterval(() => {
      //     console.log('Checking for sw update')
      //     r.update()
      //   }, 10000 /* 20s for testing purposes */)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  useEffect(() => {
    if (needRefresh && Date.now() - pageOpened < 2000) {
      alert('updating!')
      updateServiceWorker(true)
    } else if (needRefresh) {
      console.log('too late')
    }
  }, [needRefresh, updateServiceWorker])

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 40,
        left: 40,
        zIndex: 999999,
        p: 2,
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <span>Hello!</span>
      {needRefresh && <span>needRefresh</span>}
      {offlineReady && <span>offlineReady</span>}

      <button
        onClick={e => {
          updateServiceWorker(true)
        }}
      >
        updateServiceWorker
      </button>
    </Box>
  )
}
