# UI Mockup → Implementation Map

Source mockups live in `ui/`; each `code.html` is the visual reference for a route registered in
`web/src/app/router.tsx`.

## Pages

| UI mockup | Route | Page component |
| :-- | :-- | :-- |
| `ui/landing/home_page/code.html` | `/` | `web/src/features/landing/pages/LandingPage.tsx` |
| `ui/landing/privacy_policy/code.html` | `/privacy` | `web/src/features/landing/pages/PrivacyPolicyPage.tsx` |
| `ui/landing/terms_of_service/code.html` | `/terms` | `web/src/features/landing/pages/TermsOfServicePage.tsx` |
| `ui/auth/account-login/code.html` | `/login` | `web/src/features/auth/pages/LoginPage.tsx` |
| `ui/auth/account-create/code.html` | `/register` | `web/src/features/auth/pages/RegisterPage.tsx` |
| `ui/auth/password-forget/code.html` | `/forgot-password` | `web/src/features/auth/pages/ForgotPasswordPage.tsx` |
| `ui/auth/password-reset/code.html` | `/reset-password` | `web/src/features/auth/pages/ResetPasswordPage.tsx` |
| `ui/auth/password-change/code.html` | `/settings/password` | `web/src/features/auth/pages/ChangePasswordPage.tsx` |
| `ui/owner/owner_dashboard/code.html` | `/dashboard` | `web/src/features/requests/pages/RequestsPage.tsx` |
| `ui/owner/create_request/code.html` | `/requests/new` | `web/src/features/requests/pages/NewRequestPage.tsx` |
| `ui/owner/request_details/code.html` | `/requests/:id` | `web/src/features/requests/pages/RequestDetailPage.tsx` |
| `ui/client/code.html` | `/portal/:token` | `web/src/features/portal/pages/PortalPage.tsx` |

## Components extracted from mockups

| UI mockup | Supporting components |
| :-- | :-- |
| `ui/landing/home_page/code.html` | `HeroSection.tsx`, `FeatureGrid.tsx`, `WorkflowSection.tsx`, `CtaSection.tsx`, `ProductPreview.tsx` (in `web/src/features/landing/components/`) |
| `ui/landing/privacy_policy/code.html`, `ui/landing/terms_of_service/code.html` | `LegalDocument.tsx` + `web/src/features/landing/content/{privacyPolicy,termsOfService}.ts` |
| `ui/auth/account-login/code.html`, `ui/auth/account-create/code.html` | `AuthLayout.tsx`, `AuthDivider.tsx`, `GoogleButton.tsx`, `PasswordRequirementsList.tsx` |
| `ui/auth/password-change/code.html` | `PasswordStrengthMeter.tsx`, `PasswordRequirementsList.tsx`, `auth.module.css` |
| `ui/auth/password-reset/code.html` | `PasswordStrengthMeter.tsx`, `auth.module.css` |
| `ui/owner/owner_dashboard/code.html` | `RequestList.tsx`, `RequestRow.tsx`, `OwnerLayout.tsx`, `OwnerHeader.tsx` |
| `ui/owner/create_request/code.html` | `NewRequestForm.tsx`, `LinkReveal.tsx` |
| `ui/owner/request_details/code.html` | `ItemList.tsx`, `ItemRow.tsx`, `StatusBadge.tsx`, `ConfirmDialog.tsx`, `Notice.tsx`, `ProgressBar.tsx` |
| `ui/client/code.html` | `PortalHeader.tsx`, `PortalItemRow.tsx`, `CompleteBanner.tsx`, `DeadLinkScreen.tsx`, `ProgressBar.tsx` |

## Routes with no mockup

These routes are implemented without a corresponding `ui/` reference.

| Route | Page component |
| :-- | :-- |
| `/contact` | `web/src/features/landing/pages/ContactPage.tsx` |
| `/verify-email` | `web/src/features/auth/pages/VerifyEmailPage.tsx` |
| `/settings/delete` | `web/src/features/auth/pages/DeleteAccountPage.tsx` |
| `*` | `web/src/app/NotFoundPage.tsx` |

## Design systems

| `ui/` design doc | Applied to |
| :-- | :-- |
| `ui/auth/DESIGN.md` | Auth flows (`web/src/features/auth/`) |
| `ui/owner/DESIGN.md` | Owner dashboard + request pages (`web/src/features/requests/`) |
| `ui/client/DESIGN.md` | Client portal (`web/src/features/portal/`) |
| `ui/landing/DESIGN.md` | Landing + legal pages (`web/src/features/landing/`) |
