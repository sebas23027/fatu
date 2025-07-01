import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App.jsx';

// Simplified main.jsx - removing code that might cause issues
console.log("Initializing application...");

const root = document.getElementById('root');

// Add error boundary for better debugging
if (root) {
  try {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log("App rendered successfully");
  } catch (error) {
    console.error("Error rendering app:", error);
    // Fallback content to show when there's an error
    root.innerHTML = `
      <div style="color: red; margin: 20px; font-family: sans-serif;">
        <h1>Error starting application</h1>
        <p>Check the browser console for details.</p>
        <pre>${error.message}</pre>
      </div>
    `;
  }
} else {
  console.error("Root element not found");
}