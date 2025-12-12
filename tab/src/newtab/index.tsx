import React from 'react';
import ReactDOM from 'react-dom/client';
import { NewTab } from './NewTab';
import './index.css';

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <NewTab />
    </React.StrictMode>
  );
}
