/** Runtime configuration. Everything here can be changed without touching source. */

const DEFAULT_API_BASE_URL = 'https://jsonplaceholder.typicode.com';

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
} as const;
