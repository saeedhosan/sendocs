import { RouterProvider } from 'react-router-dom'
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from './providers/AuthProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { router } from './router'

export function App() {
  return (
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  )
}
