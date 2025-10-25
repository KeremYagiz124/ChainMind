/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_API_URL: string
  readonly VITE_SOCKET_URL: string
  readonly VITE_ALCHEMY_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
