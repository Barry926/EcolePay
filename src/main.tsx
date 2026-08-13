import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
// Logger global pour débugger sur mobile
(window as any)._appLog = (window as any)._appLog || [];
const originalError = console.error;
console.error = (...args) => {
  (window as any)._appLog.push({ type: 'error', msg: args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), time: new Date().toISOString() });
  originalError.apply(console, args);
};
import App from './App.tsx';
import {ThemeProvider} from './context/ThemeContext';
import {ToastProvider} from './components/Toast';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
