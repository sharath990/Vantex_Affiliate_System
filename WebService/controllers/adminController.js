import { executeQuery } from '../config/database.js';
import { calculateHierarchy } from '../utils/hierarchyUtils.js';

export const getPendingAffiliates = async (req, res) => {
  try {
    const affiliates = await executeQuery(`
      SELECT id, full_name, email, mt5_rebate_account, contact_details, 
             ox_ib_link, affiliate_code, created_at, email_verified
      FROM Affiliates 
      WHERE status = 'Pending'
      ORDER BY created_at DESC
    `);
    res.json({ affiliates });
  } catch (error) {
    console.error('Get pending affiliates error:', error);
    res.status(500).json({ message: 'Failed to fetch pending affiliates' });
  }
};

export const approveAffiliate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get affiliate email to update corresponding downline
    const affiliate = await executeQuery(`
      SELECT email FROM Affiliates WHERE id = ${id}
    `);
    
    // Update affiliate status
    await executeQuery(`
      UPDATE Affiliates 
      SET status = 'Approved', approved_at = GETDATE(), approved_by = ${req.user.id}
      WHERE id = ${id} AND status = 'Pending'
    `);
    
    // Update corresponding downline status from 'Pending' to 'Approved'
    if (affiliate.length > 0) {
      await executeQuery(`
        UPDATE Downlines 
        SET status = 'Approved' 
        WHERE email = '${affiliate[0].email}' AND status = 'Pending'
      `);
    }
    
    res.json({ message: 'Affiliate approved successfully' });
  } catch (error) {
    console.error('Approve affiliate error:', error);
    res.status(500).json({ message: 'Failed to approve affiliate' });
  }
};

export const rejectAffiliate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get affiliate email to update corresponding downline
    const affiliate = await executeQuery(`
      SELECT email FROM Affiliates WHERE id = ${id}
    `);
    
    // Update affiliate status
    await executeQuery(`
      UPDATE Affiliates 
      SET status = 'Rejected'
      WHERE id = ${id} AND status = 'Pending'
    `);
    
    // Revert downline status back to 'User Only' since affiliate application was rejected
    if (affiliate.length > 0) {
      await executeQuery(`
        UPDATE Downlines 
        SET status = 'User Only' 
        WHERE email = '${affiliate[0].email}' AND status = 'Pending'
      `);
    }
    
    res.json({ message: 'Affiliate rejected successfully' });
  } catch (error) {
    console.error('Reject affiliate error:', error);
    res.status(500).json({ message: 'Failed to reject affiliate' });
  }
};

export const getAllAffiliates = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * parseInt(limit);
    
    let whereConditions = ['status = \'Approved\''];
    
    if (status && status === 'Approved') {
      // Keep the approved filter
    } else if (status) {
      whereConditions = [`status = '${status}'`];
    }
    
    if (search) {
      whereConditions.push(`(
        full_name LIKE '%${search}%' OR 
        email LIKE '%${search}%' OR 
        affiliate_code LIKE '%${search}%' OR
        mt5_rebate_account LIKE '%${search}%'
      )`);
    }
    
    let query = `
      SELECT id, full_name, email, mt5_rebate_account, affiliate_code, 
             contact_details, ox_ib_link, status, created_at, approved_at
      FROM Affiliates
    `;
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM Affiliates${whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : ''}`;
    const totalResult = await executeQuery(countQuery);
    const total = totalResult[0].total;
    
    query += ` ORDER BY created_at DESC OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`;
    
    const affiliates = await executeQuery(query);
    res.json({
      affiliates,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasMore: offset + affiliates.length < total
    });
  } catch (error) {
    console.error('Get all affiliates error:', error);
    res.status(500).json({ message: 'Failed to fetch affiliates' });
  }
};

export const getAllDownlines = async (req, res) => {
  try {
    const { status, search, sub1_affiliate, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * parseInt(limit);
    
    // First check if Downlines table exists
    const tableCheck = await executeQuery(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Downlines'
    `);
    
    if (tableCheck[0].count === 0) {
      return res.json({
        downlines: [],
        total: 0,
        page: parseInt(page),
        totalPages: 1,
        hasMore: false
      });
    }
    
    let whereConditions = [];
    
    if (status) {
      whereConditions.push(`d.status = '${status}'`);
    }
    
    if (search) {
      whereConditions.push(`(
        d.full_name LIKE '%${search}%' OR 
        d.email LIKE '%${search}%' OR 

        a1.full_name LIKE '%${search}%' OR
        a1.affiliate_code LIKE '%${search}%' OR
        a2.full_name LIKE '%${search}%' OR
        a2.affiliate_code LIKE '%${search}%'
      )`);
    }
    
    if (sub1_affiliate) {
      whereConditions.push(`a1.affiliate_code = '${sub1_affiliate}'`);
    }
    
    let query = `
      SELECT d.id, d.full_name, d.email, d.status, d.created_at,
             d.sub1_affiliate_id, d.sub2_affiliate_id,
             a1.full_name as sub1_name, a1.affiliate_code as sub1_code,
             a2.full_name as sub2_name, a2.affiliate_code as sub2_code
      FROM Downlines d
      LEFT JOIN Affiliates a1 ON d.sub1_affiliate_id = a1.id
      LEFT JOIN Affiliates a2 ON d.sub2_affiliate_id = a2.id
    `;
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM Downlines d
      LEFT JOIN Affiliates a1 ON d.sub1_affiliate_id = a1.id
      LEFT JOIN Affiliates a2 ON d.sub2_affiliate_id = a2.id
      ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''}
    `;
    const totalResult = await executeQuery(countQuery);
    const total = totalResult[0].total;
    
    query += ` ORDER BY d.created_at DESC OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`;
    
    const downlines = await executeQuery(query);
    
    res.json({
      downlines,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasMore: offset + downlines.length < total
    });
  } catch (error) {
    console.error('Get all downlines error:', error);
    res.status(500).json({ message: 'Failed to fetch downlines' });
  }
};

export const addDownlineManually = async (req, res) => {
  try {
    const { full_name, email, sub1_affiliate_code } = req.body;

    console.log('Adding downline:', { full_name, email, sub1_affiliate_code });

    // Validate input
    if (!full_name || !email || !sub1_affiliate_code) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Escape single quotes to prevent SQL injection
    const safeName = full_name.replace(/'/g, "''");
    const safeEmail = email.replace(/'/g, "''");
    const safeCode = sub1_affiliate_code.replace(/'/g, "''");

    // Check for duplicate email in both tables
    const emailCheckAffiliate = await executeQuery(`
      SELECT id, full_name, status FROM Affiliates WHERE email = '${safeEmail}'
    `);
    
    const emailCheckDownline = await executeQuery(`
      SELECT id, full_name FROM Downlines WHERE email = '${safeEmail}'
    `);

    if (emailCheckAffiliate.length > 0) {
      const existing = emailCheckAffiliate[0];
      return res.status(409).json({ 
        message: `Email already exists as affiliate: ${existing.full_name} (Status: ${existing.status})`,
        type: 'affiliate_exists',
        existingRecord: existing
      });
    }

    if (emailCheckDownline.length > 0) {
      const existing = emailCheckDownline[0];
      return res.status(409).json({ 
        message: `Email already exists as downline: ${existing.full_name}`,
        type: 'downline_exists',
        existingRecord: existing
      });
    }

    // Get Sub1 affiliate details
    const sub1Result = await executeQuery(`
      SELECT id FROM Affiliates WHERE affiliate_code = '${safeCode}' AND status = 'Approved'
    `);

    if (sub1Result.length === 0) {
      return res.status(400).json({ message: 'Invalid Sub1 affiliate code or affiliate not approved' });
    }

    const sub1_id = sub1Result[0].id;
    console.log('Found Sub1 ID:', sub1_id);

    // Calculate proper hierarchy
    const hierarchy = await calculateHierarchy(sub1_id);
    
    console.log('Sub1:', hierarchy.sub1_id, 'Sub2:', hierarchy.sub2_id || 'NULL');

    // Insert downline
    const insertQuery = `
      INSERT INTO Downlines (full_name, email, sub1_affiliate_id, sub2_affiliate_id, status)
      VALUES ('${safeName}', '${safeEmail}', ${hierarchy.sub1_id}, ${hierarchy.sub2_id || 'NULL'}, 'User Only')
    `;
    
    console.log('Final result - Sub1:', hierarchy.sub1_id, 'Sub2:', hierarchy.sub2_id || 'NULL');
    console.log('Executing query:', insertQuery);
    await executeQuery(insertQuery);

    console.log('Downline added successfully');
    res.status(201).json({ message: 'Downline added successfully' });
  } catch (error) {
    console.error('Add downline manually error:', error);
    if (error.message.includes('UNIQUE constraint') || error.message.includes('duplicate key')) {
      res.status(409).json({ message: 'Email already exists in the system' });
    } else {
      res.status(500).json({ message: 'Failed to add downline: ' + error.message });
    }
  }
};

export const updateDownline = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, status } = req.body;

    // Escape single quotes to prevent SQL injection
    const safeName = full_name.replace(/'/g, "''");
    const safeEmail = email.replace(/'/g, "''");
    const safeStatus = status.replace(/'/g, "''");

    await executeQuery(`
      UPDATE Downlines 
      SET full_name = '${safeName}', 
          email = '${safeEmail}', 
          status = '${safeStatus}',
          updated_at = GETDATE()
      WHERE id = ${id}
    `);

    res.json({ message: 'Downline updated successfully' });
  } catch (error) {
    console.error('Update downline error:', error);
    res.status(500).json({ message: 'Failed to update downline' });
  }
};

export const updateAffiliate = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, mt5_rebate_account, contact_details, ox_ib_link, status } = req.body;

    // Get current affiliate data
    const currentAffiliate = await executeQuery(`
      SELECT email, status FROM Affiliates WHERE id = ${id}
    `);

    // Update affiliate
    await executeQuery(`
      UPDATE Affiliates 
      SET full_name = '${full_name}', 
          email = '${email}', 
          mt5_rebate_account = '${mt5_rebate_account}',
          contact_details = '${contact_details || ''}',
          ox_ib_link = '${ox_ib_link || ''}',
          status = '${status}',
          updated_at = GETDATE()
      WHERE id = ${id}
    `);

    // Sync downline status if affiliate status changed
    if (currentAffiliate.length > 0 && currentAffiliate[0].status !== status) {
      const downlineStatus = status === 'Approved' ? 'Approved' : 
                           status === 'Pending' ? 'Pending' : 
                           status === 'Rejected' ? 'User Only' : 
                           status === 'Suspended' ? 'Suspended' : 
                           status === 'Banned' ? 'Banned' : 'User Only';
      
      await executeQuery(`
        UPDATE Downlines 
        SET status = '${downlineStatus}' 
        WHERE email = '${currentAffiliate[0].email}'
      `);
    }

    res.json({ message: 'Affiliate updated successfully' });
  } catch (error) {
    console.error('Update affiliate error:', error);
    res.status(500).json({ message: 'Failed to update affiliate' });
  }
};

export const cleanupReferralTree = async (req, res) => {
  try {
    let cleanupActions = [];

    // 1. Find orphaned downlines (Sub1 is banned/deleted)
    const orphanedDownlines = await executeQuery(`
      SELECT d.id, d.full_name, d.email 
      FROM Downlines d 
      WHERE d.sub1_affiliate_id NOT IN (SELECT id FROM Affiliates WHERE status IN ('Approved', 'Pending', 'Suspended'))
    `);

    if (orphanedDownlines.length > 0) {
      await executeQuery(`
        DELETE FROM Downlines 
        WHERE sub1_affiliate_id NOT IN (SELECT id FROM Affiliates WHERE status IN ('Approved', 'Pending', 'Suspended'))
      `);
      cleanupActions.push(`Removed ${orphanedDownlines.length} orphaned downlines`);
    }

    // 2. Fix broken Sub2 links (Sub2 is not approved)
    const brokenSub2Links = await executeQuery(`
      SELECT COUNT(*) as count FROM Downlines 
      WHERE sub2_affiliate_id IS NOT NULL 
      AND sub2_affiliate_id NOT IN (SELECT id FROM Affiliates WHERE status = 'Approved')
    `);

    if (brokenSub2Links[0].count > 0) {
      await executeQuery(`
        UPDATE Downlines 
        SET sub2_affiliate_id = NULL 
        WHERE sub2_affiliate_id IS NOT NULL 
        AND sub2_affiliate_id NOT IN (SELECT id FROM Affiliates WHERE status = 'Approved')
      `);
      cleanupActions.push(`Fixed ${brokenSub2Links[0].count} broken Sub2 links`);
    }

    // 3. Fix missing Sub2 relationships (where Sub1 should have a Sub2)
    const missingSubTwoCount = await executeQuery(`
      UPDATE Downlines 
      SET sub2_affiliate_id = (
        SELECT TOP 1 d2.sub1_affiliate_id 
        FROM Downlines d2 
        WHERE d2.sub1_affiliate_id = Downlines.sub1_affiliate_id 
        AND d2.id != Downlines.id
      )
      WHERE sub2_affiliate_id IS NULL 
      AND sub1_affiliate_id IN (
        SELECT DISTINCT sub1_affiliate_id FROM Downlines 
        GROUP BY sub1_affiliate_id HAVING COUNT(*) > 1
      )
    `);

    // 4. Remove duplicate downlines (same email)
    const duplicates = await executeQuery(`
      SELECT email, COUNT(*) as count 
      FROM Downlines 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `);

    if (duplicates.length > 0) {
      await executeQuery(`
        DELETE d1 FROM Downlines d1
        INNER JOIN Downlines d2 
        WHERE d1.id > d2.id AND d1.email = d2.email
      `);
      cleanupActions.push(`Removed ${duplicates.length} duplicate downlines`);
    }

    const message = cleanupActions.length > 0 
      ? `Cleanup completed: ${cleanupActions.join(', ')}` 
      : 'No cleanup needed - referral tree is already clean';

    res.json({ 
      message,
      actions: cleanupActions,
      orphanedRemoved: orphanedDownlines.length,
      brokenLinksFixed: brokenSub2Links[0].count
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ message: 'Failed to cleanup referral tree' });
  }
};