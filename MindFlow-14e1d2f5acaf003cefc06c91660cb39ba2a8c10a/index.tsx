import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import './index.css'; // Assuming global styles might be needed, usually defined in App or handled by Tailwind CDN

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);