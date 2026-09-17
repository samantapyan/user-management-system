import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { Providers } from './app/providers';

const container = document.getElementById('root');

/* The scaffold asserts this is not null. An assertion is a promise to the
   compiler that I cannot keep, because whether the element exists depends on
   index.html, not on the types. If the mount point is ever missing I want a
   sentence that says so, not "cannot read properties of null". */
if (!container) {
  throw new Error('Root element #root was not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);
