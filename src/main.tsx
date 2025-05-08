import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import { Toaster } from './components/ui/toaster';
import { SupabaseProvider } from './lib/supabase-provider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SupabaseProvider>
      <Router>
        <App />
        <Toaster />
      </Router>
    </SupabaseProvider>
  </React.StrictMode>
);