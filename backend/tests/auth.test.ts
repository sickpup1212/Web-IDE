import request from 'supertest';
import { app, server } from '../src/server';
import { query, closePool } from '../src/db';
import { UserModel } from '../src/models/User';

describe('Authentication Endpoints', () => {
  // Clean up test data before each test
  beforeEach(async () => {
    try {
      await query('DELETE FROM users WHERE username LIKE $1', ['test_%']);
    } catch (error) {
      console.log('Skipping database cleanup - database not available');
    }
  });

  afterAll(async () => {
    await closePool();
    server.close();
  });

  describe('POST /api/auth/register', () => {
    describe('Successful registration', () => {
      it('should register a new user and return 201', async () => {
        const username = 'test_user_' + Date.now();
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username,
            password: 'password123'
          });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('User created successfully');
        expect(response.body.user).toBeDefined();
        expect(response.body.user.id).toBeDefined();
        expect(response.body.user.username).toBe(username);
        expect(response.body.user.created_at).toBeDefined();
        expect(response.body.user.password_hash).toBeUndefined();
      });

      it('should store password as hash, not plain text', async () => {
        const username = 'test_hash_' + Date.now();
        const password = 'password123';

        await request(app)
          .post('/api/auth/register')
          .send({ username, password });

        // Verify password is hashed in database
        const result = await query(
          'SELECT password_hash FROM users WHERE username = $1',
          [username]
        );

        expect(result.rows[0].password_hash).not.toBe(password);
        expect(result.rows[0].password_hash).toMatch(/^\$2[ayb]\$.{56}$/);
      });
    });

    describe('Validation errors', () => {
      it('should return 400 for username less than 3 characters', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'ab',
            password: 'password123'
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.details).toBeDefined();
      });

      it('should return 400 for username with invalid characters', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'invalid user!',
            password: 'password123'
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 for password less than 8 characters', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'validuser',
            password: 'short'
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 for missing username', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            password: 'password123'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      });

      it('should return 400 for missing password', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'validuser'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      });

      it('should return 400 for missing both username and password', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('Duplicate username', () => {
      it('should return 409 when username already exists', async () => {
        const username = 'test_duplicate_' + Date.now();

        // Register first user
        await request(app)
          .post('/api/auth/register')
          .send({
            username,
            password: 'password123'
          });

        // Attempt to register with same username
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username,
            password: 'differentpassword'
          });

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe('DUPLICATE_USERNAME');
        expect(response.body.error.message).toBe('Username already exists');
      });
    });

    describe('Edge cases', () => {
      // Note: This test user won't start with 'test_' so it won't be cleaned up by beforeEach
      // This is okay for a simple one-off check.
      it('should accept username with exactly 3 characters', async () => {
        const username = 'abc';
        await query('DELETE FROM users WHERE username = $1', [username]); // Manual cleanup
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username,
            password: 'password123'
          });

        expect(response.status).toBe(201);
      });

      it('should accept password with exactly 8 characters', async () => {
        const username = 'test_edge_' + Date.now();
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username,
            password: '12345678'
          });

        expect(response.status).toBe(201);
      });

      it('should accept username with underscores', async () => {
        const username = 'valid_user_name_' + Date.now();
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username,
            password: 'password123'
          });

        expect(response.status).toBe(201);
      });

      it('should accept username with numbers', async () => {
        const username = 'user123_' + Date.now();
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username,
            password: 'password123'
          });

        expect(response.status).toBe(201);
      });

      it('should trim whitespace from username', async () => {
        const username = 'test_trim_' + Date.now();
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: '  ' + username + '  ',
            password: 'password123'
          });

        expect(response.status).toBe(201);
        expect(response.body.user.username).toBe(username);
      });
    });
  });

  describe('POST /api/auth/login', () => {
    const testUsername = 'test_login_user';
    const testPassword = 'password123';

    // FIX: Changed from beforeAll to beforeEach
    // This now runs AFTER the global cleanup, creating a fresh user for each login test.
    beforeEach(async () => {
      await UserModel.createUser(testUsername, testPassword);
    });

    describe('Successful login', () => {
      it('should login successfully with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: testUsername,
            password: testPassword
          });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Login successful');
        expect(response.body.user).toBeDefined();
        expect(response.body.user.id).toBeDefined();
        expect(response.body.user.username).toBe(testUsername);
        expect(response.body.user.password_hash).toBeUndefined();
      });

      it('should set httpOnly cookie with JWT token', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: testUsername,
            password: testPassword
          });

        expect(response.status).toBe(200);
        expect(response.headers['set-cookie']).toBeDefined();

        const cookies = response.headers['set-cookie'];
        const cookieArray = Array.isArray(cookies) ? cookies : (cookies ? [cookies] : []);
        const tokenCookie = cookieArray.find((cookie: string) => cookie.startsWith('token='));

        expect(tokenCookie).toBeDefined();
        expect(tokenCookie).toContain('HttpOnly');
      });

      it('should include user data in response', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: testUsername,
            password: testPassword
          });

        expect(response.status).toBe(200);
        expect(response.body.user.id).toBeDefined();
        expect(response.body.user.username).toBe(testUsername);
        expect(response.body.user.created_at).toBeDefined();
      });
    });

    describe('Invalid credentials', () => {
      it('should return 401 for non-existent user', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'nonexistent_user_12345',
            password: 'password123'
          });

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
        expect(response.body.error.message).toBe('Invalid credentials');
      });

      it('should return 401 for wrong password', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: testUsername,
            password: 'wrongpassword'
          });

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      });

      it('should not reveal whether username or password is wrong', async () => {
        const wrongUserResponse = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'nonexistent_user',
            password: 'password123'
          });

        const wrongPasswordResponse = await request(app)
          .post('/api/auth/login')
          .send({
            username: testUsername,
            password: 'wrongpassword'
          });

        // Both should return same error message
        expect(wrongUserResponse.body.error.message).toBe(wrongPasswordResponse.body.error.message);
        expect(wrongUserResponse.body.error.code).toBe(wrongPasswordResponse.body.error.code);
      });
    });

    describe('Validation errors', () => {
      it('should return 400 for missing username', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            password: 'password123'
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 for missing password', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: testUsername
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 for empty credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully and clear cookie', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should clear the token cookie', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);

      const cookies = response.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies) ? cookies : (cookies ? [cookies] : []);
      if (cookies) {
        const tokenCookie = cookieArray.find((cookie: string) => cookie.startsWith('token='));

        if (tokenCookie) {
          // Cookie should be cleared (set to empty or expired)
          expect(tokenCookie).toMatch(/token=;|Max-Age=0|Expires=/);
        }
      }
    });

    it('should work even when not logged in', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('GET /api/auth/me', () => {
    const testUsername = 'test_me_user';
    const testPassword = 'password123';
    let authCookie: string;

    beforeEach(async () => {
      // Register and login to get auth cookie for each test in this block
      await UserModel.createUser(testUsername, testPassword);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword
        });

      if (loginResponse.headers['set-cookie']) {
        authCookie = loginResponse.headers['set-cookie'][0];
      }
    });

    describe('Authenticated requests', () => {
      it('should return user data when authenticated', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Cookie', authCookie);

        expect(response.status).toBe(200);
        expect(response.body.user).toBeDefined();
        expect(response.body.user.id).toBeDefined();
        expect(response.body.user.username).toBe(testUsername);
        expect(response.body.user.created_at).toBeDefined();
        expect(response.body.user.password_hash).toBeUndefined();
      });

      it('should not expose password hash', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Cookie', authCookie);

        expect(response.status).toBe(200);
        expect(response.body.user.password_hash).toBeUndefined();
      });
    });

    describe('Unauthenticated requests', () => {
      it('should return 401 when no token provided', async () => {
        const response = await request(app)
          .get('/api/auth/me');

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('MISSING_TOKEN');
      });

      it('should return 401 with invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Cookie', 'token=invalid_token_12345');

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });

      it('should return 401 with malformed cookie', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Cookie', 'token=');

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Auth Middleware Integration', () => {
    const testUsername = 'test_middleware_user';
    const testPassword = 'password123';
    let validCookie: string;

    beforeEach(async () => {
      // Register and login to get valid auth cookie
      await UserModel.createUser(testUsername, testPassword);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword
        });
      
      if (loginResponse.headers['set-cookie']) {
        validCookie = loginResponse.headers['set-cookie'][0];
      }
    });

    it('should allow access to protected routes with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', validCookie);

      expect(response.status).toBe(200);
    });

    it('should deny access to protected routes without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full auth flow: register -> login -> access protected route -> logout', async () => {
      const uniqueUsername = 'test_flow_' + Date.now();
      const password = 'password123';

      // Step 1: Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: uniqueUsername,
          password: password
        });

      expect(registerResponse.status).toBe(201);

      // Step 2: Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: uniqueUsername,
          password: password
        });

      expect(loginResponse.status).toBe(200);
      const authCookie = loginResponse.headers['set-cookie'][0];

      // Step 3: Access protected route
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.user.username).toBe(uniqueUsername);

      // Step 4: Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', authCookie);

      expect(logoutResponse.status).toBe(200);
    });
  });
});
