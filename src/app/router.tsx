import { createBrowserRouter, Navigate } from 'react-router';
import { App } from './App';
import { RouteError } from './RouteError';

/**
 * `createBrowserRouter` rather than `BrowserRouter` because `useBlocker` only works with
 * a data router, and blocking a back press is how unsaved edits get a warning.
 */
export const router = createBrowserRouter([
  { path: '/', element: <App />, errorElement: <RouteError /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
