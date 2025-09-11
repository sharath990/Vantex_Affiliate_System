import { executeQuery } from '../config/database.js';

export const calculateHierarchy = async (sub1_affiliate_id) => {
  const referrer = await executeQuery(`
    SELECT referred_by_id FROM Affiliates WHERE id = ${sub1_affiliate_id}
  `);
  
  return {
    sub1_id: sub1_affiliate_id,
    sub2_id: referrer[0]?.referred_by_id || null
  };
};