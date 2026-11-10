const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  const accept = req.get('accept') || '';

  if (accept.includes('text/html')) {
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  }

  return res.status(200).json({
    application: 'job-preparation-app',
    message: 'Job preparation application is running',
    status: 'healthy'
  });
});

app.get('/health', (_req, res) => res.status(200).json({ status: 'UP' }));

app.get('/api/info', (_req, res) => res.status(200).json({
  name: 'Job preparation',
  service: 'Node.js application'
}));

app.use(express.static(path.join(__dirname, '../public')));

module.exports = app;
