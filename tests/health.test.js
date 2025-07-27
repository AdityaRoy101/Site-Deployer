import request from 'supertest';
import app from '../src/app.js';

describe('Health Check Endpoints', () => {
  test('GET /api/v1/health/health should return 200', async () => {
    const response = await request(app)
      .get('/api/v1/health/health')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Service is healthy');
    expect(response.body).toHaveProperty('timestamp');
  });
});
