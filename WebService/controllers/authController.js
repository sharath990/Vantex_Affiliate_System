import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../config/database.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password: '***' });

    // Find admin user
    const result = await executeQuery(`
      SELECT id, username, email, password_hash, role 
      FROM AdminUsers 
      WHERE username = '${username}'
    `);
    console.log('Database query result:', result.length > 0 ? 'User found' : 'User not found');

    if (result.length === 0) {
      console.log('No user found with username:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result[0];
    console.log('Found user:', { id: user.id, username: user.username, role: user.role });
    console.log('Stored password hash:', user.password_hash);
    console.log('Input password:', password);

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password validation result:', isValidPassword);
    
    // Test with manual hash generation
    const testHash = await bcrypt.hash(password, 10);
    console.log('Test hash for input password:', testHash);
    const testCompare = await bcrypt.compare(password, testHash);
    console.log('Test compare result:', testCompare);
    if (!isValidPassword) {
      console.log('Password mismatch for user:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await executeQuery(`
      UPDATE AdminUsers 
      SET last_login = GETDATE() 
      WHERE id = ${user.id}
    `);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

export const verifyToken = async (req, res) => {
  try {
    const { user } = req;
    res.json({ user });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Token verification failed' });
  }
};