/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Module declaration for Vite PWA virtual module
declare module 'virtual:pwa-register' {
  export function registerSW(options?: { immediate?: boolean }): (reloadPage?: boolean) => void
}
