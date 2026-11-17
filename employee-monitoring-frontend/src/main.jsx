import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Clean up any stale or rogue Workbox service workers / caches on localhost
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
                registration.unregister().then((unregistered) => {
                    if (unregistered) {
                        console.log('[PWA] Stale service worker unregistered on localhost');
                    }
                });
            }
        }).catch(() => {});

        if ('caches' in window) {
            caches.keys().then((names) => {
                for (const name of names) {
                    if (name.includes('workbox') || name.includes('precache') || name.includes('ems-static')) {
                        caches.delete(name);
                    }
                }
            }).catch(() => {});
        }
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
