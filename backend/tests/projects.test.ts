import request from 'supertest';
import { app, server } from '../src/server';
import { query, closePool } from '../src/db';

describe('Project Endpoints', () => {
  let authCookie: string;
  let testUserId: number;
  const testUsername = 'test_project_user_' + Date.now();
  const testPassword = 'password123';

  // Set up test user and auth cookie before all tests
  beforeAll(async () => {
    try {
      // Register test user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          password: testPassword
        });

      testUserId = registerResponse.body.user.id;

      // Login to get auth cookie
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword
        });

      authCookie = loginResponse.headers['set-cookie'][0];
    } catch (error) {
      console.log('Error setting up test user:', error);
    }
  });

  // Clean up test data before each test
  beforeEach(async () => {
    try {
      // Delete projects for test user
      await query('DELETE FROM projects WHERE user_id = $1', [testUserId]);
    } catch (error) {
      console.log('Skipping database cleanup - database not available');
    }
  });

  afterAll(async () => {
    try {
      // Clean up test user and related data
      await query('DELETE FROM users WHERE username = $1', [testUsername]);
    } catch (error) {
      console.log('Error cleaning up test user');
    }
    await closePool();
    server.close();
  });

  describe('POST /api/projects', () => {
    describe('Successful project creation', () => {
      it('should create a new project and return 201', async () => {
        const response = await request(app)
          .post('/api/projects')
          .set('Cookie', authCookie)
          .send({
            name: 'Test Project'
          });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Project created successfully');
        expect(response.body.project).toBeDefined();
        expect(response.body.project.id).toBeDefined();
        expect(response.body.project.name).toBe('Test Project');
        expect(response.body.project.user_id).toBe(testUserId);
        expect(response.body.project.html_code).toBe('');
        expect(response.body.project.css_code).toBe('');
        expect(response.body.project.js_code).toBe('');
        expect(response.body.project.created_at).toBeDefined();
        expect(response.body.project.updated_at).toBeDefined();
      });

      it('should create project with code fields', async () => {
        const response = await request(app)
          .post('/api/projects')
          .set('Cookie', authCookie)
          .send({
            name: 'Code Project',
            html_code: '<h1>Hello</h1>',
            css_code: 'h1 { color: blue; }',
            js_code: 'console.log("test");'
          });

        expect(response.status).toBe(201);
        expect(response.body.project.html_code).toBe('<h1>Hello</h1>');
        expect(response.body.project.css_code).toBe('h1 { color: blue; }');
        expect(response.body.project.js_code).toBe('console.log("test");');
      });

      it('should default empty strings for missing code fields', async () => {
        const response = await request(app)
          .post('/api/projects')
          .set('Cookie', authCookie)
          .send({
            name: 'Minimal Project'
          });

        expect(response.status).toBe(201);
        expect(response.body.project.html_code).toBe('');
        expect(response.body.project.css_code).toBe('');
        expect(response.body.project.js_code).toBe('');
      });
    });

    describe('Authentication', () => {
      it('should return 401 without authentication', async () => {
        const response = await request(app)
          .post('/api/projects')
          .send({
            name: 'Test Project'
          });

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('MISSING_TOKEN');
      });

      it('should return 401 with invalid token', async () => {
        const response = await request(app)
          .post('/api/projects')
          .set('Cookie', 'token=invalid_token')
          .send({
            name: 'Test Project'
          });

        expect(response.status).toBe(401);
      });
    });

    describe('Validation errors', () => {
      it('should return 400 for missing name', async () => {
        const response = await request(app)
          .post('/api/projects')
          .set('Cookie', authCookie)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 for empty name', async () => {
        const response = await request(app)
          .post('/api/projects')
          .set('Cookie', authCookie)
          .send({
            name: ''
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 for name exceeding 255 characters', async () => {
        const response = await request(app)
          .post('/api/projects')
          .set('Cookie', authCookie)
          .send({
            name: 'a'.repeat(256)
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should trim whitespace from name', async () => {
        const response = await request(app)
          .post('/api/projects')
          .set('Cookie', authCookie)
          .send({
            name: '  Test Project  '
          });

        expect(response.status).toBe(201);
        expect(response.body.project.name).toBe('Test Project');
      });
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // Create some test projects
      await request(app)
        .post('/api/projects')
        .set('Cookie', authCookie)
        .send({ name: 'Project 1' });

      await request(app)
        .post('/api/projects')
        .set('Cookie', authCookie)
        .send({ name: 'Project 2' });

      await request(app)
        .post('/api/projects')
        .set('Cookie', authCookie)
        .send({ name: 'Project 3' });
    });

    it('should return all projects for authenticated user', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.projects).toBeDefined();
      expect(Array.isArray(response.body.projects)).toBe(true);
      expect(response.body.projects.length).toBe(3);
    });

    it('should return projects sorted by updated_at descending', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      const projects = response.body.projects;

      // Most recent should be first (Project 3)
      expect(projects[0].name).toBe('Project 3');
      expect(projects[2].name).toBe('Project 1');
    });

    it('should return only user\'s projects', async () => {
      // Create another user
      const otherUsername = 'other_user_' + Date.now();
      await request(app)
        .post('/api/auth/register')
        .send({
          username: otherUsername,
          password: 'password123'
        });

      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: otherUsername,
          password: 'password123'
        });

      const otherAuthCookie = otherLoginResponse.headers['set-cookie'][0];

      // Create project for other user
      await request(app)
        .post('/api/projects')
        .set('Cookie', otherAuthCookie)
        .send({ name: 'Other User Project' });

      // Get projects for original test user
      const response = await request(app)
        .get('/api/projects')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.projects.length).toBe(3);

      // Verify none of the projects belong to other user
      const hasOtherUserProject = response.body.projects.some(
        (p: any) => p.name === 'Other User Project'
      );
      expect(hasOtherUserProject).toBe(false);
    });

    it('should return empty array when user has no projects', async () => {
      // Delete all projects
      await query('DELETE FROM projects WHERE user_id = $1', [testUserId]);

      const response = await request(app)
        .get('/api/projects')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.projects).toEqual([]);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/projects');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('GET /api/projects/:id', () => {
    let projectId: number;

    beforeEach(async () => {
      // Create a test project
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Cookie', authCookie)
        .send({
          name: 'Single Project',
          html_code: '<div>Test</div>',
          css_code: 'div { color: red; }',
          js_code: 'alert("test");'
        });

      projectId = createResponse.body.project.id;
    });

    it('should return project by ID', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.project).toBeDefined();
      expect(response.body.project.id).toBe(projectId);
      expect(response.body.project.name).toBe('Single Project');
      expect(response.body.project.html_code).toBe('<div>Test</div>');
      expect(response.body.project.css_code).toBe('div { color: red; }');
      expect(response.body.project.js_code).toBe('alert("test");');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/999999')
        .set('Cookie', authCookie);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should return 403 when accessing other user\'s project', async () => {
      // Create another user
      const otherUsername = 'other_get_user_' + Date.now();
      await request(app)
        .post('/api/auth/register')
        .send({
          username: otherUsername,
          password: 'password123'
        });

      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: otherUsername,
          password: 'password123'
        });

      const otherAuthCookie = otherLoginResponse.headers['set-cookie'][0];

      // Try to access test user's project
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Cookie', otherAuthCookie);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should return 400 for invalid project ID', async () => {
      const response = await request(app)
        .get('/api/projects/invalid')
        .set('Cookie', authCookie);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_PROJECT_ID');
    });
  });

  describe('PUT /api/projects/:id', () => {
    let projectId: number;

    beforeEach(async () => {
      // Create a test project
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Cookie', authCookie)
        .send({
          name: 'Update Test Project',
          html_code: '<p>Original</p>',
          css_code: 'p { color: blue; }',
          js_code: 'console.log("original");'
        });

      projectId = createResponse.body.project.id;
    });

    it('should update project successfully', async () => {
      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Updated Project Name',
          html_code: '<p>Updated</p>',
          css_code: 'p { color: red; }',
          js_code: 'console.log("updated");'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Project updated successfully');
      expect(response.body.project.name).toBe('Updated Project Name');
      expect(response.body.project.html_code).toBe('<p>Updated</p>');
      expect(response.body.project.css_code).toBe('p { color: red; }');
      expect(response.body.project.js_code).toBe('console.log("updated");');
    });

    it('should update only provided fields', async () => {
      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Only Name Updated'
        });

      expect(response.status).toBe(200);
      expect(response.body.project.name).toBe('Only Name Updated');
      expect(response.body.project.html_code).toBe('<p>Original</p>');
      expect(response.body.project.css_code).toBe('p { color: blue; }');
      expect(response.body.project.js_code).toBe('console.log("original");');
    });

    it('should update updated_at timestamp', async () => {
      // Get original timestamp
      const getResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Cookie', authCookie);

      const originalUpdatedAt = new Date(getResponse.body.project.updated_at);

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update project
      const updateResponse = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Timestamp Test'
        });

      const newUpdatedAt = new Date(updateResponse.body.project.updated_at);
      expect(newUpdatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .put('/api/projects/999999')
        .set('Cookie', authCookie)
        .send({
          name: 'Does Not Exist'
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should return 403 when updating other user\'s project', async () => {
      // Create another user
      const otherUsername = 'other_update_user_' + Date.now();
      await request(app)
        .post('/api/auth/register')
        .send({
          username: otherUsername,
          password: 'password123'
        });

      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: otherUsername,
          password: 'password123'
        });

      const otherAuthCookie = otherLoginResponse.headers['set-cookie'][0];

      // Try to update test user's project
      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Cookie', otherAuthCookie)
        .send({
          name: 'Unauthorized Update'
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .send({
          name: 'No Auth'
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should return 400 for invalid name', async () => {
      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'a'.repeat(256)
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let projectId: number;

    beforeEach(async () => {
      // Create a test project
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Cookie', authCookie)
        .send({
          name: 'Delete Test Project'
        });

      projectId = createResponse.body.project.id;
    });

    it('should delete project successfully', async () => {
      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});

      // Verify project is deleted
      const getResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .delete('/api/projects/999999')
        .set('Cookie', authCookie);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should return 403 when deleting other user\'s project', async () => {
      // Create another user
      const otherUsername = 'other_delete_user_' + Date.now();
      await request(app)
        .post('/api/auth/register')
        .send({
          username: otherUsername,
          password: 'password123'
        });

      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: otherUsername,
          password: 'password123'
        });

      const otherAuthCookie = otherLoginResponse.headers['set-cookie'][0];

      // Try to delete test user's project
      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Cookie', otherAuthCookie);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');

      // Verify project still exists
      const getResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/projects/${projectId}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('Complete Project CRUD Flow', () => {
    it('should complete full CRUD workflow', async () => {
      // CREATE
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Cookie', authCookie)
        .send({
          name: 'CRUD Test Project',
          html_code: '<h1>Initial</h1>'
        });

      expect(createResponse.status).toBe(201);
      const projectId = createResponse.body.project.id;

      // READ (list)
      const listResponse = await request(app)
        .get('/api/projects')
        .set('Cookie', authCookie);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.projects.length).toBeGreaterThan(0);

      // READ (single)
      const getResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.project.name).toBe('CRUD Test Project');

      // UPDATE
      const updateResponse = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'CRUD Updated Project',
          html_code: '<h1>Updated</h1>'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.project.name).toBe('CRUD Updated Project');
      expect(updateResponse.body.project.html_code).toBe('<h1>Updated</h1>');

      // DELETE
      const deleteResponse = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Cookie', authCookie);

      expect(deleteResponse.status).toBe(204);

      // Verify deletion
      const verifyResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Cookie', authCookie);

      expect(verifyResponse.status).toBe(404);
    });
  });
});
