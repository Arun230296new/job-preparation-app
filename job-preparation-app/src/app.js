const express = require('express');
const app = express();
app.use(express.json());

app.get('/', (_req, res) => res.status(200).json({
  application: 'job-preparation-app',
  message: 'Job preparation application is running',
  status: 'healthy'
}));
app.get('/health', (_req, res) => res.status(200).json({ status: 'UP' }));
app.get('/api/info', (_req, res) => res.status(200).json({
  name: 'Job preparation',
  service: 'Node.js application'
}));
module.exports = app;
