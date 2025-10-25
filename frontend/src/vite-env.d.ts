/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_ALCHEMY_API_KEY?: string;
  readonly VITE_INFURA_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
