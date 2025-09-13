import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  server: process.env.DB_SERVER || '89.116.122.189',
  database: process.env.DB_DATABASE || 'VantexAffiliate',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Austratech25',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function runMigrations() {
  let pool;
  try {
    pool = await sql.connect(config);
    
    // Create migrations table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='migrations' AND xtype='U')
      CREATE TABLE migrations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        filename NVARCHAR(255) NOT NULL,
        executed_at DATETIME DEFAULT GETDATE()
      )
    `);
    
    // Get executed migrations
    const executedResult = await pool.request().query('SELECT filename FROM migrations');
    const executedMigrations = executedResult.recordset.map(r => r.filename);
    
    // Read migration files
    const migrationsDir = path.join(__dirname, 'sql');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found');
      return;
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        console.log(`Running migration: ${file}`);
        const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        await pool.request().query(migrationSQL);
        await pool.request()
          .input('filename', sql.NVarChar, file)
          .query('INSERT INTO migrations (filename) VALUES (@filename)');
        
        console.log(`✅ Migration ${file} completed`);
      }
    }
    
    console.log('All migrations completed');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

runMigrations();