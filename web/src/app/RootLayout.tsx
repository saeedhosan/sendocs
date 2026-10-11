import { Outlet } from 'react-router-dom'
import { RouteProgress } from './RouteProgress'

/** App-wide chrome that must render across every route. */
export function RootLayout() {
  return (
    <>
      <RouteProgress />
      <Outlet />
    </>
  )
}
