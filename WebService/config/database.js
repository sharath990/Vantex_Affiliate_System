import sql from 'msnodesqlv8';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `server=${process.env.DB_SERVER || 'localhost'};Database=${process.env.DB_DATABASE || 'VantexAffiliate'};uid=${process.env.DB_USER || 'sa'};pwd=${process.env.DB_PASSWORD};Driver={ODBC Driver 17 for SQL Server}`;

console.log('Using connection string:', connectionString);

// Promisify the callback-based functions
const query = promisify(sql.query);

export const connectDB = async () => {
  try {
    console.log('Testing SQL Server connection...');
    const result = await query(connectionString, 'SELECT GETDATE() AS now');
    console.log('✅ Connected to SQL Server successfully!');
    console.log('Current time:', result[0].now);
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:');
    console.error('Error:', err.message);
    process.exit(1);
  }
};

export const executeQuery = async (queryText, params = []) => {
  try {
    const result = await query(connectionString, queryText);
    return result;
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

export const getPool = () => null;
export { sql };