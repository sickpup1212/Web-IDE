import request from 'supertest';
import { app, server } from '../src/server';

describe('Health Check Endpoint', () => {
  afterAll((done) => {
    server.close(done);
  });

  describe('GET /api/health', () => {
    it('should return 200 status code', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
    });

    it('should return JSON response', async () => {
      const response = await request(app).get('/api/health');
      expect(response.type).toBe('application/json');
    });

    it('should return status "ok"', async () => {
      const response = await request(app).get('/api/health');
      expect(response.body.status).toBe('ok');
    });

    it('should return timestamp', async () => {
      const response = await request(app).get('/api/health');
      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.timestamp).toBe('string');
      // Verify it's a valid ISO date string
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    });

    it('should return uptime', async () => {
      const response = await request(app).get('/api/health');
      expect(response.body.uptime).toBeDefined();
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should have all required fields', async () => {
      const response = await request(app).get('/api/health');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });
});
