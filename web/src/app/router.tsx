import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { transitions } from '../config/transition'
import { UserLayout } from '../layouts/UserLayout'
import { GuestLayout } from '../layouts/GuestLayout'
import { GuestOnly } from './guards/GuestOnly'
import { RequireAuth } from './guards/RequireAuth'
import { NotFoundPage } from './NotFoundPage'
import { RootLayout } from './RootLayout'

type PageModule = Record<string, ComponentType>

/**
 * Code-split a page behind the route-level `lazy` API. This keeps the initial
 * bundle small and gives the router a real pending state during chunk loads,
 * which the navigation progress bar surfaces.
 */
const lazyPage =
  (load: () => Promise<PageModule>, name: string) =>
  async (): Promise<{ Component: ComponentType }> => {
    const module = await load()
    return { Component: module[name] }
  }

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <GuestLayout />,
        children: [
          {
            index: true,
            lazy: lazyPage(
              () => import('../features/landing/pages/LandingPage'),
              'LandingPage',
            ),
          },
          {
            path: 'privacy',
            lazy: lazyPage(
              () => import('../features/landing/pages/PrivacyPolicyPage'),
              'PrivacyPolicyPage',
            ),
          },
          {
            path: 'terms',
            lazy: lazyPage(
              () => import('../features/landing/pages/TermsOfServicePage'),
              'TermsOfServicePage',
            ),
          },
          {
            path: 'contact',
            lazy: lazyPage(
              () => import('../features/landing/pages/ContactPage'),
              'ContactPage',
            ),
          },
        ],
      },
      {
        element: <GuestOnly />,
        children: [
          {
            path: 'auth/google/callback',
            lazy: lazyPage(
              () => import('../features/auth/pages/GoogleCallbackPage'),
              'GoogleCallbackPage',
            ),
          },
          {
            path: 'login',
            lazy: lazyPage(
              () => import('../features/auth/pages/LoginPage'),
              'LoginPage',
            ),
          },
          {
            path: 'register',
            lazy: lazyPage(
              () => import('../features/auth/pages/RegisterPage'),
              'RegisterPage',
            ),
          },
          {
            path: 'forgot-password',
            lazy: lazyPage(
              () => import('../features/auth/pages/ForgotPasswordPage'),
              'ForgotPasswordPage',
            ),
          },
          {
            path: 'reset-password',
            lazy: lazyPage(
              () => import('../features/auth/pages/ResetPasswordPage'),
              'ResetPasswordPage',
            ),
          },
        ],
      },
      {
        path: 'verify-email',
        lazy: lazyPage(
          () => import('../features/auth/pages/VerifyEmailPage'),
          'VerifyEmailPage',
        ),
      },
      {
        path: 'portal/:token',
        lazy: lazyPage(
          () => import('../features/portal/pages/PortalPage'),
          'PortalPage',
        ),
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: 'settings/password',
            lazy: lazyPage(
              () => import('../features/auth/pages/ChangePasswordPage'),
              'ChangePasswordPage',
            ),
          },
          {
            path: 'settings/delete',
            lazy: lazyPage(
              () => import('../features/auth/pages/DeleteAccountPage'),
              'DeleteAccountPage',
            ),
          },
          {
            element: <UserLayout />,
            children: [
              {
                path: 'dashboard',
                lazy: lazyPage(
                  () => import('../features/requests/pages/RequestsPage'),
                  'RequestsPage',
                ),
              },
              {
                path: 'requests/new',
                lazy: lazyPage(
                  () => import('../features/requests/pages/NewRequestPage'),
                  'NewRequestPage',
                ),
              },
              {
                path: 'requests/:id',
                lazy: lazyPage(
                  () => import('../features/requests/pages/RequestDetailPage'),
                  'RequestDetailPage',
                ),
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

// Enable browser View Transitions for every navigation at the router's single
// entry point, so we don't have to touch each <Link>/<NavLink>. `useNavigate`
// (used by those links) funnels through `router.navigate`, which reads the
// `viewTransition` option; passing an extra option degrades safely elsewhere.
const originalNavigate = router.navigate.bind(router) as unknown as (
  to: unknown,
  options?: unknown,
) => Promise<void>

router.navigate = ((to: unknown, options?: Record<string, unknown>) =>
  typeof to === 'number'
    ? originalNavigate(to)
    : originalNavigate(to, {
        ...options,
        viewTransition: options?.viewTransition ?? transitions.view.enabled,
      })) as typeof router.navigate
