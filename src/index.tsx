// import { scan } from 'react-scan' // must be imported before React and React DOM
import React from 'react'
import '6-shared/localization'
import { createRoot } from 'react-dom/client'
import { MainApp } from '1-app'

// scan({ enabled: true })

const container = document.getElementById('root')
if (!container) throw new Error('No root container')
const root = createRoot(container)

root.render(<MainApp />)
