import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import logger, { flushPending } from '@/lib/logger';
import './styles/globals.css';

// Flush any log entries queued before the bridge was ready
setTimeout(flushPending, 100);

logger.info('App mounted');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
