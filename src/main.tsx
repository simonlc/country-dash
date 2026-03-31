import React from 'react';
import ReactDOM from 'react-dom/client';
import NiceModal from '@ebay/nice-modal-react';
import { RouterProvider } from '@tanstack/react-router';
import { AppProviders } from './app/providers';
import { router } from './app/router';
import '@/styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <NiceModal.Provider>
        <RouterProvider router={router} />
      </NiceModal.Provider>
    </AppProviders>
  </React.StrictMode>,
);
