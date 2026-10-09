import { createBrowserRouter } from 'react-router-dom'
import { ChangePasswordPage } from '../features/auth/pages/ChangePasswordPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { VerifyEmailPage } from '../features/auth/pages/VerifyEmailPage'
import { NewRequestPage } from '../features/requests/pages/NewRequestPage'
import { RequestDetailPage } from '../features/requests/pages/RequestDetailPage'
import { RequestsPage } from '../features/requests/pages/RequestsPage'
import { OwnerLayout } from '../layouts/OwnerLayout'
import { GuestOnly } from './guards/GuestOnly'
import { RequireAuth } from './guards/RequireAuth'
import { RootRedirect } from './guards/RootRedirect'
import { NotFoundPage } from './NotFoundPage'

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: <GuestOnly />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },
  { path: 'verify-email', element: <VerifyEmailPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <OwnerLayout />,
        children: [
          { path: 'dashboard', element: <RequestsPage /> },
          { path: 'requests/new', element: <NewRequestPage /> },
          { path: 'requests/:id', element: <RequestDetailPage /> },
          { path: 'settings/password', element: <ChangePasswordPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
