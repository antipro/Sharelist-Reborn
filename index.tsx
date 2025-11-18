import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const startApp = () => {
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
};

// Check if we are running in Cordova environment
if (window.hasOwnProperty('cordova') || document.URL.indexOf('http') === -1) {
  document.addEventListener('deviceready', startApp, false);
} else {
  // Web environment
  startApp();
}