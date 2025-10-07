import { UserModel } from '../src/models/User';
import { query, closePool } from '../src/db';

describe('User Model', () => {
  // Clean up test data before each test
  beforeEach(async () => {
    try {
      await query('DELETE FROM users WHERE username LIKE $1', ['test_%']);
    } catch (error) {
      // Database might not be available in test environment
      console.log('Skipping database cleanup - database not available');
    }
  });

  afterAll(async () => {
    await closePool();
  });

  describe('createUser()', () => {
    it('should create a new user with hashed password', async () => {
      const username = 'test_user_' + Date.now();
      const password = 'password123';

      const user = await UserModel.createUser(username, password);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.username).toBe(username);
      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();
      expect((user as any).password_hash).toBeUndefined(); // Should not return password hash
    });

    it('should throw error for duplicate username', async () => {
      const username = 'test_duplicate_' + Date.now();
      const password = 'password123';

      // Create first user
      await UserModel.createUser(username, password);

      // Attempt to create duplicate
      await expect(
        UserModel.createUser(username, password)
      ).rejects.toThrow('Username already exists');
    });

    it('should hash the password (not store plain text)', async () => {
      const username = 'test_hash_' + Date.now();
      const password = 'password123';

      await UserModel.createUser(username, password);

      // Fetch the user directly from database
      const result = await query(
        'SELECT password_hash FROM users WHERE username = $1',
        [username]
      );

      expect(result.rows[0].password_hash).toBeDefined();
      expect(result.rows[0].password_hash).not.toBe(password);
      expect(result.rows[0].password_hash).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash format
    });
  });

  describe('findByUsername()', () => {
    it('should return user when username exists', async () => {
      const username = 'test_find_' + Date.now();
      const password = 'password123';

      // Create test user
      const createdUser = await UserModel.createUser(username, password);

      // Find user
      const foundUser = await UserModel.findByUsername(username);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.username).toBe(username);
      expect(foundUser?.password_hash).toBeDefined(); // Should include password hash
    });

    it('should return null when username does not exist', async () => {
      const user = await UserModel.findByUsername('nonexistent_user_' + Date.now());
      expect(user).toBeNull();
    });
  });

  describe('findById()', () => {
    it('should return user when ID exists', async () => {
      const username = 'test_findid_' + Date.now();
      const password = 'password123';

      // Create test user
      const createdUser = await UserModel.createUser(username, password);

      // Find user by ID
      const foundUser = await UserModel.findById(createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.username).toBe(username);
      expect((foundUser as any)?.password_hash).toBeUndefined(); // Should NOT include password hash
    });

    it('should return null when ID does not exist', async () => {
      const user = await UserModel.findById(999999);
      expect(user).toBeNull();
    });
  });

  describe('verifyPassword()', () => {
    it('should return true for correct password', async () => {
      const username = 'test_verify_' + Date.now();
      const password = 'password123';

      // Create user
      await UserModel.createUser(username, password);
      const user = await UserModel.findByUsername(username);

      // Verify correct password
      const isValid = await UserModel.verifyPassword(password, user!.password_hash);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const username = 'test_verify2_' + Date.now();
      const password = 'password123';

      // Create user
      await UserModel.createUser(username, password);
      const user = await UserModel.findByUsername(username);

      // Verify incorrect password
      const isValid = await UserModel.verifyPassword('wrongpassword', user!.password_hash);
      expect(isValid).toBe(false);
    });
  });

  describe('sanitizeUser()', () => {
    it('should remove password_hash from user object', () => {
      const user = {
        id: 1,
        username: 'testuser',
        password_hash: '$2a$10$hashedpassword',
        created_at: new Date(),
        updated_at: new Date()
      };

      const sanitized = UserModel.sanitizeUser(user);

      expect(sanitized.id).toBe(user.id);
      expect(sanitized.username).toBe(user.username);
      expect(sanitized.created_at).toBe(user.created_at);
      expect(sanitized.updated_at).toBe(user.updated_at);
      expect((sanitized as any).password_hash).toBeUndefined();
    });
  });
});
