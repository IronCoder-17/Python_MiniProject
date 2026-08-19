// pages/admin/NotificationBell.js
import React, { useState, useEffect, useRef } from 'react';
import { notificationsAPI } from '../../services/api';
import { Bell, Mail, MessageSquare, CalendarClock, Clock, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ICONS = {
  'New Lead': Mail, 'New Inquiry': MessageSquare, 'Site Visit Today': CalendarClock,
  'Follow-up Due': Clock, 'Booking Completed': Award,
};

function timeAgo(d) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = () => notificationsAPI.list().then(({ data }) => { setItems(data.data); setUnread(data.unread_count); }).catch(() => {});

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openItem = async (n) => {
    if (!n.live) await notificationsAPI.markRead(n.id).catch(() => {});
    setOpen(false);
    navigate(n.entity_type === 'lead' ? '/admin/leads' : '/admin/inquiries');
    load();
  };

  const markAllRead = async () => { await notificationsAPI.markAllRead(); load(); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', color: 'var(--text-main)' }}>
        <Bell size={20} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, background: '#E74C3C', color: '#fff',
            borderRadius: '50%', fontSize: '.65rem', width: 16, height: 16, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontWeight: 700,
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 32, right: 0, width: 340, maxHeight: 420, overflowY: 'auto',
          background: 'var(--white)', border: '1px solid rgba(201,162,75,.25)', borderRadius: 12,
          boxShadow: '0 20px 50px rgba(0,0,0,.15)', zIndex: 500,
        }}>
          <div className="flex-between" style={{ padding: '12px 16px', borderBottom: '1px solid rgba(201,162,75,.15)' }}>
            <span style={{ fontWeight: 700, fontSize: '.9rem' }}>Notifications</span>
            {unread > 0 && <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '.75rem', cursor: 'pointer' }}>Mark all read</button>}
          </div>
          {items.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--mist)', fontSize: '.85rem' }}>No notifications</div>}
          {items.map(n => {
            const Icon = ICONS[n.type] || Bell;
            return (
              <div key={n.id} onClick={() => openItem(n)}
                style={{
                  display: 'flex', gap: 10, padding: '12px 16px', cursor: 'pointer',
                  borderBottom: '1px solid rgba(201,162,75,.08)', background: n.is_read ? 'transparent' : 'rgba(201,162,75,.06)',
                }}>
                <Icon size={16} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: '.83rem', fontWeight: n.is_read ? 400 : 600 }}>{n.title}</div>
                  {n.message && <div style={{ fontSize: '.75rem', color: 'var(--mist)' }}>{n.message}</div>}
                  <div style={{ fontSize: '.7rem', color: 'var(--mist)', marginTop: 2 }}>{timeAgo(n.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
