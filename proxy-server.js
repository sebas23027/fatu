import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = 9000;

// Debug middleware to see incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Very specific API proxy for login endpoint
app.use('/api/login.php', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  pathRewrite: function(path) {
    console.log(`Rewriting path from ${path} to /faturasbomba/api/login.php`);
    return '/faturasbomba/api/login.php';
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying login request to: ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Received login response with status: ${proxyRes.statusCode}`);
  },
  logLevel: 'debug'
}));

// Specific API proxy for faturas endpoint
app.use('/api/faturas.php', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  pathRewrite: function(path, req) {
    // Preserve query string for DELETE requests
    const queryString = req.url.split('?')[1];
    const newPath = '/faturasbomba/api/faturas.php' + (queryString ? `?${queryString}` : '');
    console.log(`Rewriting path from ${path} to ${newPath}`);
    return newPath;
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying faturas request to: ${proxyReq.path}`);
    console.log(`Original URL: ${req.url}`);
    console.log(`Method: ${req.method}`);
    
    // Forward the Authorization header from the client request if it exists
    const authHeader = req.headers.authorization;
    if (authHeader) {
      proxyReq.setHeader('Authorization', authHeader);
      console.log(`Forwarded Authorization header: ${authHeader}`);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Received faturas response with status: ${proxyRes.statusCode}`);
  },
  logLevel: 'debug'
}));

// General API proxy
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/faturasbomba/api', // Corrige o caminho para incluir /faturasbomba/api
  },
  onProxyReq: (proxyReq, req, res) => {
    // Forward the Authorization header from the client request if it exists
    const authHeader = req.headers.authorization;
    if (authHeader) {
      proxyReq.setHeader('Authorization', authHeader);
      console.log(`Forwarded Authorization header from client: ${authHeader}`);
    } else {
      // Fallback to the hardcoded token only if no Authorization header exists
      proxyReq.setHeader('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZXhwIjoxNzQ0MzA0MjY4fQ.o0Q5ZXe6nnUKot8iieyiBUcpd05M4o6pFG5WjVhJJfI');
      console.log(`Added fallback Authorization header to request`);
    }
  },
  logLevel: 'debug'
}));

// Static files proxy to React dev server with improved handling for library imports
app.use('/', createProxyMiddleware({
  target: 'http://localhost:5173',
  changeOrigin: true,
  ws: true,
  onProxyRes: (proxyRes, req, res) => {
    // Log response for debugging library imports
    if (req.url.includes('.js') && (req.url.includes('jspdf') || req.url.includes('pdf'))) {
      console.log(`Proxying library request for: ${req.url} with status: ${proxyRes.statusCode}`);
    }
  },
  logLevel: 'debug'
}));

app.listen(port, () => {
  console.log(`Proxy server running on http://localhost:${port}`);
  console.log(`API requests (/api/*) -> http://localhost:8080/faturasbomba/api/*`);
  console.log(`All other requests -> http://localhost:5173/*`);
});