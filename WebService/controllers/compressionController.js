import { executeQuery } from '../config/database.js';

// Compression handling when affiliate is removed/closed
export const compressDownlines = async (removedAffiliateId) => {
  try {
    console.log(`Starting compression for affiliate ${removedAffiliateId}`);

    // Get the removed affiliate's referrer (who will become new Sub1 for compressed downlines)
    const removedAffiliateResult = await executeQuery(`
      SELECT referred_by_id FROM Affiliates WHERE id = ${removedAffiliateId}
    `);
    
    const newSub1Id = removedAffiliateResult[0]?.referred_by_id;

    // Get all downlines where removed affiliate is Sub1 (direct downlines)
    const directDownlines = await executeQuery(`
      SELECT * FROM Downlines WHERE sub1_affiliate_id = ${removedAffiliateId}
    `);

    // Compress each direct downline up one level
    for (const downline of directDownlines) {
      if (newSub1Id) {
        // Move downline up: new Sub1 = removed affiliate's referrer, new Sub2 = new Sub1's referrer
        const newSub1Result = await executeQuery(`
          SELECT referred_by_id FROM Affiliates WHERE id = ${newSub1Id}
        `);
        
        const newSub2Id = newSub1Result[0]?.referred_by_id;
        
        await executeQuery(`
          UPDATE Downlines 
          SET sub1_affiliate_id = ${newSub1Id}, sub2_affiliate_id = ${newSub2Id || 'NULL'}, updated_at = GETDATE()
          WHERE id = ${downline.id}
        `);
      } else {
        // If removed affiliate has no referrer, delete the downline (orphaned)
        await executeQuery(`
          DELETE FROM Downlines WHERE id = ${downline.id}
        `);
      }
    }

    // Update downlines where removed affiliate is Sub2 (set Sub2 to null)
    await executeQuery(`
      UPDATE Downlines 
      SET sub2_affiliate_id = NULL, updated_at = GETDATE()
      WHERE sub2_affiliate_id = ${removedAffiliateId}
    `);

    // Handle case where removed affiliate also exists as a downline record
    const affiliateAsDownline = await executeQuery(`
      SELECT * FROM Downlines WHERE sub1_affiliate_id = ${removedAffiliateId} OR sub2_affiliate_id = ${removedAffiliateId}
    `);
    
    // Check if removed affiliate has their own downline record
    const ownDownlineRecord = await executeQuery(`
      SELECT * FROM Affiliates a 
      INNER JOIN Downlines d ON a.email = d.email 
      WHERE a.id = ${removedAffiliateId}
    `);
    
    if (ownDownlineRecord.length > 0) {
      // Remove the affiliate's own downline record
      await executeQuery(`
        DELETE FROM Downlines 
        WHERE email = (SELECT email FROM Affiliates WHERE id = ${removedAffiliateId})
      `);
    }

    // Count actual compressions vs deletions
    let actualCompressions = 0;
    for (const downline of directDownlines) {
      if (newSub1Id) {
        actualCompressions++; // This was compressed
      }
      // If no newSub1Id, downline was deleted (not compressed)
    }

    console.log(`Compression completed for affiliate ${removedAffiliateId}`);
    return { 
      success: true, 
      message: 'Downlines compressed successfully',
      compressedCount: actualCompressions
    };
  } catch (error) {
    console.error('Compression error:', error);
    throw error;
  }
};

export const removeAffiliate = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    console.log(`Removing affiliate ${id}, reason: ${reason}`);

    // Get affiliate's referrer to reassign their referrals
    const affiliateResult = await executeQuery(`
      SELECT referred_by_id FROM Affiliates WHERE id = ${id}
    `);
    const newReferrerId = affiliateResult[0]?.referred_by_id;

    // First compress downlines
    const compressionResult = await compressDownlines(parseInt(id));

    // Update affiliates who were referred by this affiliate
    await executeQuery(`
      UPDATE Affiliates 
      SET referred_by_id = ${newReferrerId || 'NULL'}
      WHERE referred_by_id = ${id}
    `);

    // Remove affiliate completely from the system
    await executeQuery(`
      DELETE FROM Affiliates WHERE id = ${id}
    `);

    console.log(`Affiliate ${id} successfully removed and ${compressionResult.compressedCount} downlines compressed`);
    res.json({ 
      message: `Affiliate removed and ${compressionResult.compressedCount} downlines compressed successfully`,
      compressedCount: compressionResult.compressedCount
    });
  } catch (error) {
    console.error('Remove affiliate error:', error);
    res.status(500).json({ message: `Failed to remove affiliate: ${error.message}` });
  }
};