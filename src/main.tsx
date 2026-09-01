import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter out benign internal library polling warnings from ZXing and dev WebSocket
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = function (...args: any[]) {
    const text = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a) || '')).join(' ');
    if (
      text.includes('MultiFormatReader') ||
      text.includes('Micro QR') ||
      text.includes('ReaderException') ||
      text.includes('Cannot determine Micro QR')
    ) {
      return; // Ignore internal per-frame barcode candidate misses
    }
    originalWarn.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

