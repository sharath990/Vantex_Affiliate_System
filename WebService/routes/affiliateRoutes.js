import express from 'express';
import { body } from 'express-validator';
import { registerAffiliate, addDownline, getAffiliateDownlines, verifyEmail } from '../controllers/affiliateController.js';

const router = express.Router();

router.post('/register', [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('mt5_rebate_account').notEmpty().withMessage('MT5 rebate account is required')
], registerAffiliate);

router.post('/downlines', [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('affiliate_code').notEmpty().withMessage('Affiliate code is required')
], addDownline);

router.get('/:affiliate_code/downlines', getAffiliateDownlines);
router.get('/verify-email', verifyEmail);

export default router;