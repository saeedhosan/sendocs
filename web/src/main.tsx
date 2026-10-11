import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { applyTransitionStyles } from './config/transition'
import './styles/tokens.css'
import './styles/global.css'
import './styles/utilities.css'

applyTransitionStyles()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
