/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the users API. Falls back to the public fixture when unset. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
