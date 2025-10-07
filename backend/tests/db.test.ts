import { query, closePool } from '../src/db';

describe('Database Connection', () => {
  afterAll(async () => {
    await closePool();
  });

  describe('Database Connection Test', () => {
    it('should successfully connect to database', async () => {
      const result = await query('SELECT 1 as test');
      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].test).toBe(1);
    });

    it('should execute SELECT NOW() query', async () => {
      const result = await query('SELECT NOW() as current_time');
      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].current_time).toBeInstanceOf(Date);
    });

    it('should handle query with parameters', async () => {
      const result = await query('SELECT $1 as value', ['test_value']);
      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].value).toBe('test_value');
    });

    it('should throw error for invalid SQL', async () => {
      await expect(query('INVALID SQL QUERY')).rejects.toThrow();
    });

    it('should return correct row count', async () => {
      const result = await query('SELECT 1 UNION SELECT 2 UNION SELECT 3');
      expect(result.rowCount).toBe(3);
      expect(result.rows.length).toBe(3);
    });
  });

  describe('Query Logging', () => {
    it('should log query execution', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await query('SELECT 1');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Executed query'),
        expect.any(Object)
      );
      consoleSpy.mockRestore();
    });
  });
});
