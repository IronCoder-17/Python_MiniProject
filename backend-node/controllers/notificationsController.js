// controllers/notificationsController.js
const pool = require('../config/db');

// GET /api/notifications — admin/agent
// Merges persisted notifications (New Lead, New Inquiry, Booking Completed)
// with "live" ones computed on the fly from today's site visits and any
// currently-due follow-ups. Live items are never marked read/stored — they
// simply stop appearing once the underlying visit/follow-up is resolved.
exports.list = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);

  const [persisted] = await pool.query(
    `SELECT id, type, title, message, entity_type, entity_id, is_read, created_at
     FROM notifications ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );

  const [dueVisits] = await pool.query(
    `SELECT sv.id, sv.entity_type, sv.entity_id, sv.visit_time,
            COALESCE(l.full_name, i.full_name) AS person_name
     FROM crm_site_visits sv
     LEFT JOIN leads l     ON sv.entity_type='lead'    AND sv.entity_id = l.id
     LEFT JOIN inquiries i ON sv.entity_type='inquiry' AND sv.entity_id = i.id
     WHERE sv.visit_date = CURDATE() AND sv.visit_status IN ('Scheduled','Confirmed')
     ORDER BY sv.visit_time ASC`
  );

  const [dueFollowups] = await pool.query(
    `SELECT f.id, f.entity_type, f.entity_id, f.type, f.due_date,
            COALESCE(l.full_name, i.full_name) AS person_name
     FROM crm_followups f
     LEFT JOIN leads l     ON f.entity_type='lead'    AND f.entity_id = l.id
     LEFT JOIN inquiries i ON f.entity_type='inquiry' AND f.entity_id = i.id
     WHERE f.status='Pending' AND f.due_date <= NOW()
     ORDER BY f.due_date ASC`
  );

  const liveVisits = dueVisits.map(v => ({
    id: `live-visit-${v.id}`,
    type: 'Site Visit Today',
    title: 'Site Visit Today',
    message: `${v.person_name || 'Client'}${v.visit_time ? ' at ' + v.visit_time : ''}`,
    entity_type: v.entity_type,
    entity_id: v.entity_id,
    is_read: false,
    created_at: new Date(),
    live: true,
  }));

  const liveFollowups = dueFollowups.map(f => ({
    id: `live-followup-${f.id}`,
    type: 'Follow-up Due',
    title: `${f.type} Follow-up Due`,
    message: f.person_name || 'Client',
    entity_type: f.entity_type,
    entity_id: f.entity_id,
    is_read: false,
    created_at: f.due_date,
    live: true,
  }));

  const merged = [...liveVisits, ...liveFollowups, ...persisted]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);

  const unread_count = merged.filter(n => !n.is_read).length;

  res.json({ data: merged, unread_count });
};

// PUT /api/notifications/:id/read — admin/agent
exports.markRead = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id)) {
    // "live" notifications (e.g. live-visit-12) aren't persisted rows;
    // nothing to mark, but return success so the frontend flow doesn't error.
    return res.json({ message: 'Nothing to update for live notifications' });
  }
  await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  res.json({ message: 'Marked as read' });
};

// PUT /api/notifications/read-all — admin/agent
exports.markAllRead = async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
  res.json({ message: 'All notifications marked as read' });
};

// Internal helper used by leadsController / inquiriesController to create
// a notification row when a new lead/inquiry comes in.
exports.notify = async (type, title, message, entity_type, entity_id) => {
  await pool.query(
    `INSERT INTO notifications (type, title, message, entity_type, entity_id) VALUES (?,?,?,?,?)`,
    [type, title, message, entity_type, entity_id]
  );
};