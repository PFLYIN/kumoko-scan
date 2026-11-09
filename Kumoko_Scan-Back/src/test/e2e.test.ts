import request from 'supertest';
import app from '../App';

describe('API documentation', () => {
  it('serves the OpenAPI UI without requiring a database connection', async () => {
    const response = await request(app).get('/api-docs/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Swagger UI');
  });
});