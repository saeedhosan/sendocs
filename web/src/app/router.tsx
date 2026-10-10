import { createBrowserRouter } from 'react-router-dom'
import { ChangePasswordPage } from '../features/auth/pages/ChangePasswordPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { VerifyEmailPage } from '../features/auth/pages/VerifyEmailPage'
import { PrivacyPolicyPage } from '../features/landing/pages/PrivacyPolicyPage'
import { TermsOfServicePage } from '../features/landing/pages/TermsOfServicePage'
import { NewRequestPage } from '../features/requests/pages/NewRequestPage'
import { RequestDetailPage } from '../features/requests/pages/RequestDetailPage'
import { RequestsPage } from '../features/requests/pages/RequestsPage'
import { PortalPage } from '../features/portal/pages/PortalPage'
import { OwnerLayout } from '../layouts/OwnerLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { GuestOnly } from './guards/GuestOnly'
import { HomeRoute } from './guards/HomeRoute'
import { RequireAuth } from './guards/RequireAuth'
import { NotFoundPage } from './NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomeRoute /> },
      { path: 'privacy', element: <PrivacyPolicyPage /> },
      { path: 'terms', element: <TermsOfServicePage /> },
    ],
  },
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
  { path: 'portal/:token', element: <PortalPage /> },
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
