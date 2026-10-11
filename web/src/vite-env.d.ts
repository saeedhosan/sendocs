/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_URL: string;
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_TITLE: string;
    readonly VITE_APP_SLUG: string;
    readonly VITE_APP_VERSION: string;
    readonly VITE_APP_DESCRIPTION: string;
    readonly VITE_EMAIL_CONTACT: string;
    readonly VITE_EMAIL_PRIVACY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
