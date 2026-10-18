import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { BASE } from './lib/basePath';
import App from './App';
import { AuthProvider } from './lib/auth';
import { ToastProvider } from './components/Toast';
import { SiteProvider } from './lib/site';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={BASE.replace(/\/$/, '') || '/'}>
      <AuthProvider>
        <SiteProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </SiteProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
