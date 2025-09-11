import express from 'express';
import { body } from 'express-validator';
import { 
  getPendingAffiliates, 
  approveAffiliate, 
  rejectAffiliate,
  getAllAffiliates,
  getAllDownlines,
  addDownlineManually,
  updateAffiliate,
  updateDownline,
  cleanupReferralTree
} from '../controllers/adminController.js';
import { removeAffiliate } from '../controllers/compressionController.js';
import { getAffiliateReport, getDownlineReport } from '../controllers/reportingController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/affiliates/pending', getPendingAffiliates);
router.get('/affiliates', getAllAffiliates);
router.put('/affiliates/:id/approve', approveAffiliate);
router.put('/affiliates/:id/reject', rejectAffiliate);

router.get('/downlines', getAllDownlines);
router.post('/downlines', [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('sub1_affiliate_code').notEmpty().withMessage('Sub1 affiliate code is required')
], addDownlineManually);

router.put('/downlines/:id', updateDownline);

// Compression and removal
router.delete('/affiliates/:id', removeAffiliate);

// Update affiliate
router.put('/affiliates/:id', updateAffiliate);

// Cleanup referral tree
router.post('/cleanup-tree', cleanupReferralTree);

// Reporting
router.get('/reports/affiliates', getAffiliateReport);
router.get('/reports/downlines', getDownlineReport);

export default router;