const request = require('supertest');
const app = require('../src/app');

describe('Job preparation application', () => {
  test('GET / returns healthy status', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('healthy');
  });
  test('GET /health returns UP', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('UP');
  });
  test('GET /api/info returns project name', async () => {
    const response = await request(app).get('/api/info');
    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Job preparation');
  });
});
