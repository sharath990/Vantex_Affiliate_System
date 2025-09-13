import { executeQuery } from '../config/database.js';
import { validationResult } from 'express-validator';
import { calculateHierarchy } from '../utils/hierarchyUtils.js';
import { 
  checkRateLimit, 
  recordAttempt, 
  isDisposableEmail, 
  verifyRecaptcha, 
  calculateSpamScore, 
  generateVerificationToken,
  checkAdvancedDuplicates 
} from '../utils/antiSpam.js';
import { sendVerificationEmail } from '../utils/emailService.js';

export const registerAffiliate = async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0];
  const userAgent = req.headers['user-agent'] || '';
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await recordAttempt(clientIP, req.body.email, false);
      return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, email, mt5_rebate_account, contact_details, ox_ib_link, referrer_code } = req.body;

    // 1. Rate limiting check
    const rateLimitCheck = await checkRateLimit(clientIP, email);
    if (!rateLimitCheck.allowed) {
      await recordAttempt(clientIP, email, false);
      return res.status(429).json({ 
        message: rateLimitCheck.reason,
        blockedUntil: rateLimitCheck.blockedUntil 
      });
    }

    // 2. Check disposable email
    if (await isDisposableEmail(email)) {
      await recordAttempt(clientIP, email, false);
      return res.status(400).json({ message: 'Disposable email addresses are not allowed' });
    }

    // 4. Advanced duplicate detection
    const duplicateCheck = await checkAdvancedDuplicates({ full_name, email, mt5_rebate_account, contact_details });
    if (duplicateCheck.isDuplicate) {
      await recordAttempt(clientIP, email, false);
      return res.status(409).json({ 
        message: `${duplicateCheck.type === 'exact' ? 'Account already exists' : 'Similar registration detected'}`,
        type: duplicateCheck.type
      });
    }

    // 5. Calculate spam score
    const spamScore = calculateSpamScore({ full_name, email, mt5_rebate_account, contact_details });
    const isHighRisk = spamScore > 50;

    // Get referrer ID - first check if this person was added as downline
    let referred_by_id = null;
    
    // Check if this email exists as a downline (auto-link to their Sub1)
    const downlineRecord = await executeQuery(`
      SELECT sub1_affiliate_id FROM Downlines WHERE email = '${email}'
    `);
    
    if (downlineRecord.length > 0) {
      referred_by_id = downlineRecord[0].sub1_affiliate_id;
      
      // Update downline status from 'User Only' to 'Pending' since they're becoming an affiliate
      await executeQuery(`
        UPDATE Downlines SET status = 'Pending' WHERE email = '${email}' AND status = 'User Only'
      `);
    } else if (referrer_code && referrer_code.trim()) {
      // Manual referrer code provided
      const referrer = await executeQuery(`
        SELECT id FROM Affiliates WHERE affiliate_code = '${referrer_code.trim().replace(/'/g, "''")}' AND status = 'Approved'
      `);
      if (referrer.length > 0) {
        referred_by_id = referrer[0].id;
      }
    }

    // Generate email verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    console.log('Generated verification token:', verificationToken);

    // Insert new affiliate with anti-spam data
    await executeQuery(`
      INSERT INTO Affiliates (
        full_name, email, mt5_rebate_account, contact_details, ox_ib_link, referred_by_id,
        email_verification_token, email_verification_expires, registration_ip, user_agent,
        spam_score, is_flagged, flagged_reason, status
      )
      VALUES (
        '${full_name}', '${email}', '${mt5_rebate_account}', '${contact_details || ''}', 
        '${ox_ib_link || ''}', ${referred_by_id || 'NULL'}, '${verificationToken}', 
        '${verificationExpires.toISOString()}', '${clientIP}', '${userAgent}', 
        ${spamScore}, ${isHighRisk ? 1 : 0}, 
        ${isHighRisk ? `'High spam score: ${spamScore}'` : 'NULL'},
        '${isHighRisk ? 'Flagged' : 'Pending'}'
      )
    `);

    // Get the inserted affiliate with generated code
    const newAffiliate = await executeQuery(`
      SELECT TOP 1 id, affiliate_code FROM Affiliates WHERE email = '${email}' ORDER BY id DESC
    `);

    // Generate affiliate code if not exists
    const affiliateId = newAffiliate[0].id;
    const affiliateCode = `VTX${String(affiliateId).padStart(5, '0')}`;
    
    await executeQuery(`
      UPDATE Affiliates SET affiliate_code = '${affiliateCode}' WHERE id = ${affiliateId}
    `);

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationToken, full_name, affiliateCode);
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
    }

    // Record successful attempt
    await recordAttempt(clientIP, email, true);

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      affiliate_code: affiliateCode,
      requiresVerification: true,
      flagged: isHighRisk
    });

  } catch (error) {
    console.error('Registration error:', error);
    await recordAttempt(clientIP, req.body.email, false);
    res.status(500).json({ message: 'Registration failed' });
  }
};

export const addDownline = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, email, affiliate_code } = req.body;

    // Get affiliate info
    const affiliate = await executeQuery(`
      SELECT id, status FROM Affiliates 
      WHERE affiliate_code = '${affiliate_code}' AND status = 'Approved'
    `);

    if (affiliate.length === 0) {
      return res.status(400).json({ 
        message: 'Invalid affiliate code or affiliate not approved' 
      });
    }

    // Check for existing downline with same email
    const existingDownline = await executeQuery(`
      SELECT COUNT(*) as count FROM Downlines WHERE email = '${email}'
    `);

    if (existingDownline[0].count > 0) {
      return res.status(400).json({ 
        message: 'Email already registered as downline' 
      });
    }

    // Check if this email will become an affiliate later
    const existingAffiliate = await executeQuery(`
      SELECT COUNT(*) as count FROM Affiliates WHERE email = '${email}'
    `);

    if (existingAffiliate[0].count > 0) {
      return res.status(400).json({ 
        message: 'Email already registered as affiliate' 
      });
    }

    // Calculate proper hierarchy
    const hierarchy = await calculateHierarchy(affiliate[0].id);

    // Insert downline with proper hierarchy
    await executeQuery(`
      INSERT INTO Downlines (full_name, email, sub1_affiliate_id, sub2_affiliate_id)
      VALUES ('${full_name}', '${email}', ${hierarchy.sub1_id}, ${hierarchy.sub2_id || 'NULL'})
    `);

    res.status(201).json({ message: 'Downline added successfully' });

  } catch (error) {
    console.error('Add downline error:', error);
    res.status(500).json({ message: 'Failed to add downline' });
  }
};

export const getAffiliateDownlines = async (req, res) => {
  try {
    const { affiliate_code } = req.params;

    // Get affiliate ID
    const affiliate = await executeQuery(`
      SELECT id FROM Affiliates WHERE affiliate_code = '${affiliate_code}'
    `);

    if (affiliate.length === 0) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    // Get downlines
    const downlines = await executeQuery(`
      SELECT id, full_name, email, status, created_at
      FROM Downlines 
      WHERE sub1_affiliate_id = ${affiliate[0].id} OR sub2_affiliate_id = ${affiliate[0].id}
      ORDER BY created_at DESC
    `);

    res.json({ downlines });

  } catch (error) {
    console.error('Get downlines error:', error);
    res.status(500).json({ message: 'Failed to fetch downlines' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    console.log('Verification attempt with token:', token);

    if (!token) {
      return res.status(400).json({ message: 'Verification token required' });
    }

    // Find affiliate with this token (or already verified with this email)
    let affiliate = await executeQuery(`
      SELECT id, email, full_name, email_verification_expires, email_verified, affiliate_code 
      FROM Affiliates 
      WHERE email_verification_token = '${token.replace(/'/g, "''")}'`
    );
    
    // If token not found, check if this is a cleared token for already verified email
    if (affiliate.length === 0) {
      affiliate = await executeQuery(`
        SELECT id, email, full_name, email_verification_expires, email_verified, affiliate_code 
        FROM Affiliates 
        WHERE email_verified = 1 AND email_verification_token IS NULL
        ORDER BY id DESC
      `);
      
      if (affiliate.length > 0) {
        console.log('Found recently verified affiliate:', affiliate[0].affiliate_code);
        return res.status(200).json({ 
          message: `Email already verified for ${affiliate[0].affiliate_code}. Registration is pending admin approval.`,
          verified: true,
          affiliateCode: affiliate[0].affiliate_code
        });
      }
    }

    console.log('Found affiliate:', affiliate.length > 0 ? 'Yes' : 'No');

    if (affiliate.length === 0) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    const affiliateData = affiliate[0];

    // Check if already verified
    if (affiliateData.email_verified) {
      return res.status(200).json({ 
        message: `Email already verified for ${affiliateData.affiliate_code}. Registration is pending admin approval.`,
        verified: true,
        affiliateCode: affiliateData.affiliate_code
      });
    }

    // Check if token expired
    if (new Date() > new Date(affiliateData.email_verification_expires)) {
      return res.status(400).json({ message: 'Verification token expired' });
    }

    // Verify email and change status to Pending
    await executeQuery(`
      UPDATE Affiliates 
      SET email_verified = 1, status = 'Pending', email_verification_token = NULL, email_verification_expires = NULL
      WHERE id = ${affiliateData.id}
    `);

    // Update corresponding downline status if exists
    await executeQuery(`
      UPDATE Downlines 
      SET status = 'Pending' 
      WHERE email = '${affiliateData.email}' AND status = 'User Only'
    `);

    console.log('Email verified for affiliate:', affiliateData.affiliate_code);

    res.status(200).json({ 
      message: `Email verified successfully! Your affiliate ID: ${affiliateData.affiliate_code}. Registration is now pending admin approval.`,
      verified: true,
      affiliateCode: affiliateData.affiliate_code
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Email verification failed' });
  }
};