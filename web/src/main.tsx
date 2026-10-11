import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { applyTransitionStyles } from './lib/transitionStyles'
import './styles/tailwind.css'
import './styles/global.css'

applyTransitionStyles()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
