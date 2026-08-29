/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" starts the MSW mock backend (see mock-backend/). Anything else disables it. */
  readonly VITE_ENABLE_MOCKS: "true" | "false"
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
