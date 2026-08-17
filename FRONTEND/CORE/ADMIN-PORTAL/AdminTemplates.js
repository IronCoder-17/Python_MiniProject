// pages/admin/AdminTemplates.js
import React, { useState, useEffect } from 'react';
import { templatesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save, MessageCircle, Mail, Info } from 'lucide-react';

const PLACEHOLDER_HELP = 'Use {name}, {property}, {city}, {budget}' ;

export default function AdminTemplates() {
  const [tab, setTab] = useState('whatsapp'); // 'whatsapp' | 'email'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'edit'
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = tab === 'whatsapp' ? await templatesAPI.listWhatsapp() : await templatesAPI.listEmail();
      setItems(data.data);
    } catch (err) {
      const status = err.response?.status;
      const isSessionIssue = status === 401 || (status === 403 && /expired/i.test(err.response?.data?.error || ''));
      if (!isSessionIssue) toast.error(err.response?.data?.error || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab]);

  const openAdd = () => { setForm(tab === 'whatsapp' ? { name: '', message: '', sort_order: items.length + 1 } : { name: '', subject: '', body: '', sort_order: items.length + 1 }); setModal('add'); };
  const openEdit = (it) => { setForm(it); setModal('edit'); };
  const close = () => setModal(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      if (tab === 'whatsapp') {
        if (!form.name || !form.message) { toast.error('Name and message are required'); setSaving(false); return; }
        if (modal === 'add') await templatesAPI.createWhatsapp(form);
        else await templatesAPI.updateWhatsapp(form.id, form);
      } else {
        if (!form.name || !form.subject || !form.body) { toast.error('Name, subject and body are required'); setSaving(false); return; }
        if (modal === 'add') await templatesAPI.createEmail(form);
        else await templatesAPI.updateEmail(form.id, form);
      }
      toast.success('Template saved');
      close();
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm('Remove this template?')) return;
    if (tab === 'whatsapp') await templatesAPI.deleteWhatsapp(id);
    else await templatesAPI.deleteEmail(id);
    toast.success('Template removed');
    load();
  };

  return (
    <div>
      <div className="flex-between mb-32" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 className="display-3" style={{ marginBottom: 4 }}>Message Templates</h2>
          <p style={{ color: 'var(--mist)' }}>Reusable WhatsApp & Email templates used from the customer panel</p>
        </div>
        <button className="btn btn-gold btn-sm" onClick={openAdd}><Plus size={14} /> New Template</button>
      </div>

      <div className="flex gap-8 mb-24">
        <button className={`btn btn-sm ${tab === 'whatsapp' ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setTab('whatsapp')}>
          <MessageCircle size={14} /> WhatsApp
        </button>
        <button className={`btn btn-sm ${tab === 'email' ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setTab('email')}>
          <Mail size={14} /> Email
        </button>
      </div>

      <div className="admin-card" style={{ padding: 14, marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Info size={15} style={{ color: 'var(--gold)', flexShrink: 0 }} />
        <span style={{ fontSize: '.83rem', color: 'var(--mist)' }}>
          {PLACEHOLDER_HELP}{tab === 'email' ? ', {executive_name}' : ''} — these are auto-filled from the customer's record when used.
        </span>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gap: 14 }}>
          {items.length === 0 && <p style={{ color: 'var(--mist)', textAlign: 'center', padding: 40 }}>No templates yet.</p>}
          {items.map(it => (
            <div key={it.id} className="admin-card" style={{ padding: 18 }}>
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{it.name}</span>
                <div className="flex gap-8">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(it)}><Edit2 size={13} /></button>
                  <button className="btn btn-danger btn-sm" onClick={() => del(it.id)}><Trash2 size={13} /></button>
                </div>
              </div>
              {tab === 'email' && <div style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 4 }}>{it.subject}</div>}
              <div style={{ fontSize: '.85rem', color: 'var(--mist)', whiteSpace: 'pre-wrap' }}>{tab === 'whatsapp' ? it.message : it.body}</div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={close}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'var(--ink)', border: '1px solid rgba(201,162,75,.2)', borderRadius: 'var(--radius-lg)', padding: 36, width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto' }}>
            <div className="flex-between mb-24">
              <h3 className="h4">{modal === 'add' ? 'New' : 'Edit'} {tab === 'whatsapp' ? 'WhatsApp' : 'Email'} Template</h3>
              <button onClick={close}><X size={20} style={{ color: 'var(--mist)' }} /></button>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Template Name</label>
              <input className="form-input" value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Site Visit Reminder" />
            </div>

            {tab === 'email' && (
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Subject</label>
                <input className="form-input" value={form.subject || ''} onChange={e => set('subject', e.target.value)} />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">{tab === 'whatsapp' ? 'Message' : 'Body'}</label>
              <textarea className="form-textarea" style={{ minHeight: 140 }}
                value={(tab === 'whatsapp' ? form.message : form.body) || ''}
                onChange={e => set(tab === 'whatsapp' ? 'message' : 'body', e.target.value)} />
            </div>

            <div className="flex gap-12 mt-24">
              <button className="btn btn-gold" onClick={save} disabled={saving}><Save size={15} /> {saving ? 'Saving…' : 'Save'}</button>
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}