import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../src/styles/globals.css';
import { Options } from './Options';

export const openInTab = true;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
);
