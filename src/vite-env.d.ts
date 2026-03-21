/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NSITE_HOST?: string;
  readonly VITE_RECOMEND_ROOT_PUBKEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
