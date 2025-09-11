import { executeQuery } from '../config/database.js';
import crypto from 'crypto';

// Rate limiting check
export const checkRateLimit = async (ip, email = null) => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Check IP-based rate limiting
  const ipAttempts = await executeQuery(`
    SELECT * FROM RegistrationAttempts 
    WHERE ip_address = '${ip}' AND last_attempt > '${oneHourAgo.toISOString()}'
  `);

  if (ipAttempts.length > 0) {
    const attempt = ipAttempts[0];
    if (attempt.is_blocked && new Date(attempt.blocked_until) > now) {
      return { allowed: false, reason: 'IP temporarily blocked', blockedUntil: attempt.blocked_until };
    }
    if (attempt.attempt_count >= 10) {
      // Block IP for 1 hour
      const blockUntil = new Date(now.getTime() + 60 * 60 * 1000);
      await executeQuery(`
        UPDATE RegistrationAttempts 
        SET is_blocked = 1, blocked_until = '${blockUntil.toISOString()}'
        WHERE ip_address = '${ip}'
      `);
      return { allowed: false, reason: 'Too many attempts', blockedUntil: blockUntil };
    }
  }
  return { allowed: true };
};

// Record registration attempt
export const recordAttempt = async (ip, email, success = false) => {
  const existing = await executeQuery(`
    SELECT * FROM RegistrationAttempts WHERE ip_address = '${ip}'
  `);

  if (existing.length > 0) {
    if (success) {
      // Reset on successful registration
      await executeQuery(`
        UPDATE RegistrationAttempts 
        SET attempt_count = 0, last_attempt = GETDATE(), is_blocked = 0, blocked_until = NULL
        WHERE ip_address = '${ip}'
      `);
    } else {
      // Increment failed attempts
      await executeQuery(`
        UPDATE RegistrationAttempts 
        SET attempt_count = attempt_count + 1, last_attempt = GETDATE()
        WHERE ip_address = '${ip}'
      `);
    }
  } else {
    await executeQuery(`
      INSERT INTO RegistrationAttempts (ip_address, email, attempt_count, last_attempt)
      VALUES ('${ip}', '${email || ''}', ${success ? 0 : 1}, GETDATE())
    `);
  }
};

// Check disposable email
export const isDisposableEmail = async (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  const result = await executeQuery(`
    SELECT COUNT(*) as count FROM DisposableEmailDomains WHERE domain = '${domain}'
  `);
  return result[0].count > 0;
};

// Verify reCAPTCHA
export const verifyRecaptcha = async (token) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) return { success: false, score: 0 };

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`
    });
    
    const data = await response.json();
    return {
      success: data.success,
      score: data.score || 0,
      action: data.action
    };
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return { success: false, score: 0 };
  }
};

// Calculate spam score
export const calculateSpamScore = (data) => {
  let score = 0;

  // Name patterns
  if (/^[a-z]+[0-9]+$/.test(data.full_name?.toLowerCase())) score += 20; // name + numbers
  if (data.full_name?.length < 3) score += 30; // too short
  if (/(.)\1{3,}/.test(data.full_name)) score += 25; // repeated characters

  // Email patterns
  if (data.email?.includes('+')) score += 10; // email aliases
  if (/[0-9]{5,}/.test(data.email)) score += 15; // many numbers in email

  // Contact details
  if (!data.contact_details || data.contact_details.length < 10) score += 20;

  // MT5 account pattern
  if (!/^[0-9]{6,}$/.test(data.mt5_rebate_account)) score += 25;

  return Math.min(score, 100);
};

// Generate email verification token
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Enhanced duplicate detection
export const checkAdvancedDuplicates = async (data) => {
  const { full_name, email, mt5_rebate_account, contact_details } = data;
  
  // Check exact matches
  const exactMatches = await executeQuery(`
    SELECT id, full_name, email, status FROM Affiliates 
    WHERE email = '${email}' OR mt5_rebate_account = '${mt5_rebate_account}'
  `);

  if (exactMatches.length > 0) {
    return { isDuplicate: true, type: 'exact', matches: exactMatches };
  }

  return { isDuplicate: false };
};