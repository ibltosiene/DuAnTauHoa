import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.scss';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <div className="admin-app">
      <App />
    </div>
  </React.StrictMode>
);