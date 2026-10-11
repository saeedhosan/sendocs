/// <reference types="vite/client" />

function getEnv(key: string, fallback: string): string {
  try {
    return import.meta.env[key] ?? fallback
  } catch {
    return fallback
  }
}

export const app = {
    url: getEnv('VITE_APP_URL', 'http://localhost:3000'),
    env: getEnv('MODE', 'development'),
    name: getEnv('VITE_APP_NAME', 'Sendocs'),
    title: getEnv('VITE_APP_TITLE', 'Sendocs'),
    slug: getEnv('VITE_APP_SLUG', 'sendocs'),
    version: getEnv('VITE_APP_VERSION', '0.0.0'),
    description: getEnv('VITE_APP_DESCRIPTION', 'Document request platform'),
    emails: {
        contact: getEnv('VITE_EMAIL_CONTACT', 'privacy@sendocs.internal'),
        privacy: getEnv('VITE_EMAIL_PRIVACY', 'privacy@sendocs.internal'),
    },
} as const;
