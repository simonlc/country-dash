import React from 'react';
import ReactDOM from 'react-dom/client';
import NiceModal from '@ebay/nice-modal-react';
import { AppProviders } from './app/providers';
import { GamePage } from '@/routes/GamePage';
import '@/styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <NiceModal.Provider>
        <GamePage />
      </NiceModal.Provider>
    </AppProviders>
  </React.StrictMode>,
);
