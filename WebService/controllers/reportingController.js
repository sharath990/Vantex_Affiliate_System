import { executeQuery } from '../config/database.js';

export const getAffiliateReport = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      registrationMonth,
      format = 'json' 
    } = req.query;

    let query = `
      SELECT 
        a.id,
        a.full_name,
        a.email,
        a.mt5_rebate_account,
        a.affiliate_code,
        a.status,
        a.created_at,
        a.approved_at,
        COUNT(d.id) as total_downlines,
        CASE 
          WHEN MONTH(a.created_at) = MONTH(GETDATE()) AND YEAR(a.created_at) = YEAR(GETDATE()) 
          THEN 'New This Month' 
          ELSE 'Existing' 
        END as registration_period
      FROM Affiliates a
      LEFT JOIN Downlines d ON a.id = d.sub1_affiliate_id OR a.id = d.sub2_affiliate_id
      WHERE 1=1
    `;

    const params = [];

    if (startDate) {
      query += ` AND a.created_at >= '${startDate}'`;
    }
    if (endDate) {
      query += ` AND a.created_at <= '${endDate}'`;
    }
    if (status) {
      query += ` AND a.status = '${status}'`;
    }
    if (registrationMonth) {
      query += ` AND MONTH(a.created_at) = ${registrationMonth}`;
    }

    query += ` GROUP BY a.id, a.full_name, a.email, a.mt5_rebate_account, a.affiliate_code, a.status, a.created_at, a.approved_at`;
    query += ` ORDER BY a.created_at DESC`;

    const affiliates = await executeQuery(query);

    if (format === 'csv') {
      // Generate CSV
      const csv = generateCSV(affiliates);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=affiliates-report.csv');
      return res.send(csv);
    }

    res.json({
      affiliates,
      summary: {
        total: affiliates.length,
        newThisMonth: affiliates.filter(a => a.registration_period === 'New This Month').length,
        existing: affiliates.filter(a => a.registration_period === 'Existing').length,
        byStatus: getStatusSummary(affiliates)
      }
    });

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

export const getDownlineReport = async (req, res) => {
  try {
    const { affiliateId, format = 'json' } = req.query;

    let query = `
      SELECT 
        d.id,
        d.full_name,
        d.email,
        d.status,
        d.created_at,
        a1.full_name as sub1_name,
        a1.affiliate_code as sub1_code,
        a2.full_name as sub2_name,
        a2.affiliate_code as sub2_code
      FROM Downlines d
      LEFT JOIN Affiliates a1 ON d.sub1_affiliate_id = a1.id
      LEFT JOIN Affiliates a2 ON d.sub2_affiliate_id = a2.id
    `;

    if (affiliateId) {
      query += ` WHERE d.sub1_affiliate_id = ${affiliateId} OR d.sub2_affiliate_id = ${affiliateId}`;
    }

    query += ` ORDER BY d.created_at DESC`;

    const downlines = await executeQuery(query);

    if (format === 'csv') {
      const csv = generateDownlineCSV(downlines);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=downlines-report.csv');
      return res.send(csv);
    }

    res.json({ downlines });

  } catch (error) {
    console.error('Downline report error:', error);
    res.status(500).json({ message: 'Failed to generate downline report' });
  }
};

const generateCSV = (data) => {
  const headers = ['ID', 'Full Name', 'Email', 'MT5 Account', 'Affiliate Code', 'Status', 'Registration Date', 'Approval Date', 'Total Downlines', 'Registration Period'];
  const rows = data.map(item => [
    item.id,
    item.full_name,
    item.email,
    item.mt5_rebate_account,
    item.affiliate_code,
    item.status,
    item.created_at,
    item.approved_at || '',
    item.total_downlines,
    item.registration_period
  ]);
  
  return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
};

const generateDownlineCSV = (data) => {
  const headers = ['ID', 'Full Name', 'Email', 'Status', 'Registration Date', 'Sub1 Name', 'Sub1 Code', 'Sub2 Name', 'Sub2 Code'];
  const rows = data.map(item => [
    item.id,
    item.full_name,
    item.email,
    item.status,
    item.created_at,
    item.sub1_name || '',
    item.sub1_code || '',
    item.sub2_name || '',
    item.sub2_code || ''
  ]);
  
  return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
};

const getStatusSummary = (affiliates) => {
  const summary = {};
  affiliates.forEach(affiliate => {
    summary[affiliate.status] = (summary[affiliate.status] || 0) + 1;
  });
  return summary;
};