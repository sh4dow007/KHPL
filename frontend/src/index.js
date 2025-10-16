import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    } catch (error) {
      console.error('Error registering service worker:', error);
    }
  });
}

// Store deferred prompt globally for install button
window.addEventListener('beforeinstallprompt', (e) => {
  try {
    e.preventDefault();
    window.deferredPrompt = e;
  } catch (error) {
    console.error('Error handling beforeinstallprompt:', error);
  }
});
