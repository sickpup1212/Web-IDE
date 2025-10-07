import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DB_CONN_STRING
console.log(connectionString)
/**
 * Initialize the database by running the schema.sql file
 */
async function initializeDatabase() {
  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');

    // Read schema.sql file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('Running schema.sql...');
    await pool.query(schema);

    console.log('Database initialized successfully!');
    console.log('Tables created:');
    console.log('  - users');
    console.log('  - projects');

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase();
}

export default initializeDatabase;
