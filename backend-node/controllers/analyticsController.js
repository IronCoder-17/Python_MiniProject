// controllers/analyticsController.js — Phase 4: Dashboard Analytics
const pool = require('../config/db');

// GET /api/analytics/funnel — New/Contacted/Qualified/Site Visits/Bookings/Sales/Lost + conversion rate
// Combines leads + inquiries into one funnel.
exports.funnel = async (_req, res) => {
  const countBoth = async (whereSql, params = []) => {
    const [[{ c: leadCount }]] = await pool.query(`SELECT COUNT(*) AS c FROM leads WHERE ${whereSql}`, params);
    const [[{ c: inqCount }]]  = await pool.query(`SELECT COUNT(*) AS c FROM inquiries WHERE ${whereSql}`, params);
    return leadCount + inqCount;
  };

  const [newLeads, contacted, qualified, siteVisits, bookings, sales, lostLeads, total] = await Promise.all([
    countBoth(`status='New'`),
    countBoth(`status='Contacted'`),
    countBoth(`status='Qualified'`),
    countBoth(`status IN ('Site Visit Scheduled','Visited')`),
    countBoth(`status IN ('Booking','Payment')`),
    countBoth(`status='Completed'`),
    countBoth(`status='Lost'`),
    countBoth(`1=1`),
  ]);

  const conversion_rate = total > 0 ? +(((bookings + sales) / total) * 100).toFixed(1) : 0;

  res.json({
    new_leads: newLeads, contacted, qualified, site_visits: siteVisits,
    bookings, sales, lost_leads: lostLeads, total, conversion_rate,
  });
};

// GET /api/analytics/monthly-leads — last 12 months, leads + inquiries combined
exports.monthlyLeads = async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
     FROM (
       SELECT created_at FROM leads WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       UNION ALL
       SELECT created_at FROM inquiries WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
     ) combined
     GROUP BY month ORDER BY month ASC`
  );
  res.json({ data: rows });
};

// GET /api/analytics/sales-graph — monthly count of Completed (Sale) leads+inquiries, last 12 months
exports.salesGraph = async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
     FROM (
       SELECT created_at FROM leads WHERE status='Completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       UNION ALL
       SELECT created_at FROM inquiries WHERE status='Completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
     ) combined
     GROUP BY month ORDER BY month ASC`
  );
  res.json({ data: rows });
};

// GET /api/analytics/lead-sources — breakdown by source_page (leads) / inquiry_type (inquiries)
exports.leadSources = async (_req, res) => {
  const [leadSources] = await pool.query(
    `SELECT COALESCE(source_page, 'Unknown') AS source, COUNT(*) AS count FROM leads GROUP BY source_page`
  );
  const [inquirySources] = await pool.query(
    `SELECT COALESCE(inquiry_type, 'Unknown') AS source, COUNT(*) AS count FROM inquiries GROUP BY inquiry_type`
  );
  const merged = {};
  [...leadSources, ...inquirySources].forEach(({ source, count }) => {
    merged[source] = (merged[source] || 0) + count;
  });
  res.json({ data: Object.entries(merged).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count) });
};

// GET /api/analytics/city-wise — leads+inquiries grouped by city
exports.cityWise = async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT city, COUNT(*) AS count FROM (
       SELECT COALESCE(city, 'Unknown') AS city FROM leads
       UNION ALL
       SELECT COALESCE(p.city, 'Unknown') AS city FROM inquiries i LEFT JOIN properties p ON p.id = i.property_id
     ) combined
     GROUP BY city ORDER BY count DESC LIMIT 10`
  );
  res.json({ data: rows });
};
