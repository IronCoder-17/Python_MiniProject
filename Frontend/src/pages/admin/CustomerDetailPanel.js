// pages/admin/CustomerDetailPanel.js
// Unified CRM panel for a lead OR inquiry ("entityType" = 'lead' | 'inquiry').
// Slides in as a right-hand drawer from AdminLeads / AdminInquiries.
import React, { useState, useEffect, useCallback } from 'react';
import { crmAPI, templatesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  X, Phone, MessageCircle, Mail, MapPin, FileText, Star,
  Clock, UserCheck, Plus, Trash2, CheckCircle2, ChevronDown,
  Car, Upload, Home, IndianRupee,
} from 'lucide-react';

const DOC_TYPES = ['PAN','Aadhaar','Passport','Income Proof','Booking Form','Agreement','Payment Receipt','Other'];
const VISIT_STATUSES = ['Scheduled','Confirmed','In Progress','Completed','Cancelled','No Show'];
const BEDROOM_OPTS = ['1BHK','2BHK','3BHK','4BHK','4+ BHK'];

const STATUS_FLOW = [
  'New','Contacted','Qualified','Site Visit Scheduled','Visited',
  'Negotiation','Booking','Payment','Completed','Closed','Lost',
];

const FOLLOWUP_TYPES = ['Call','Meeting','Site Visit','Reminder'];

function fillTemplate(str, record) {
  if (!str) return str;
  return str
    .replace(/{name}/g, record.full_name || '')
    .replace(/{property}/g, record.property_title || record.property_type || 'the property')
    .replace(/{city}/g, record.city || record.property_city || '')
    .replace(/{budget}/g, record.budget || '');
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CustomerDetailPanel({ entityType, id, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');
  const [executives, setExecutives] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [showWaTemplates, setShowWaTemplates] = useState(false);
  const [showEmailTemplates, setShowEmailTemplates] = useState(false);
  const [waTemplates, setWaTemplates] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [followupForm, setFollowupForm] = useState({ type: 'Call', due_date: '', notes: '' });
  const [showFollowupForm, setShowFollowupForm] = useState(false);

  const [visits, setVisits] = useState([]);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitForm, setVisitForm] = useState({ visit_date: '', visit_time: '', driver_name: '', driver_phone: '', pickup_address: '', executive_id: '', vehicle_number: '', notes: '' });

  const [documents, setDocuments] = useState([]);
  const [docType, setDocType] = useState('PAN');
  const [uploading, setUploading] = useState(false);

  const [prefs, setPrefs] = useState({ preferred_location: '', budget_min: '', budget_max: '', bedrooms: '', amenities: '', loan_required: false, purpose: 'Self Use' });
  const [prefsSaving, setPrefsSaving] = useState(false);

  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');

  const loadExtras = useCallback(async () => {
    try {
      const [v, d, p, m] = await Promise.all([
        crmAPI.listVisits(entityType, id),
        crmAPI.listDocuments(entityType, id),
        crmAPI.getPreferences(entityType, id),
        crmAPI.listMessages(entityType, id),
      ]);
      setVisits(v.data.data);
      setDocuments(d.data.data);
      if (p.data.data) setPrefs({ ...p.data.data, loan_required: !!p.data.data.loan_required });
      setMessages(m.data.data);
    } catch (e) { /* non-fatal */ }
  }, [entityType, id]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await crmAPI.getDetail(entityType, id);
      setData(data);
    } catch (e) {
      toast.error('Could not load customer details');
    }
    setLoading(false);
  }, [entityType, id]);

  useEffect(() => { load(); loadExtras(); }, [load, loadExtras]);
  useEffect(() => { crmAPI.listExecutives().then(({ data }) => setExecutives(data.data)).catch(() => {}); }, []);
  useEffect(() => {
    templatesAPI.listWhatsapp().then(({ data }) => setWaTemplates(data.data)).catch(() => {});
    templatesAPI.listEmail().then(({ data }) => setEmailTemplates(data.data)).catch(() => {});
    templatesAPI.emailStatus().then(({ data }) => setSmtpConfigured(data.configured)).catch(() => {});
  }, []);

  if (!id) return null;

  const record = data?.record;
  const mobile = record?.mobile_number?.replace(/\D/g, '');
  const waNumber = mobile?.length === 10 ? `91${mobile}` : mobile;

  const touch = async (fn) => { await fn(); await load(); onChanged?.(); };

  const call = () => {
    if (!mobile) return;
    window.open(`tel:${record.mobile_number}`, '_self');
    touch(() => crmAPI.logContact(entityType, id, 'Call'));
  };

  const whatsapp = (template) => {
    if (!waNumber) return;
    const msg = template ? fillTemplate(template.message, record) : '';
    window.open(`https://wa.me/${waNumber}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`, '_blank');
    touch(() => crmAPI.logContact(entityType, id, 'WhatsApp'));
    setShowWaTemplates(false);
  };

  const emailMailtoFallback = (subject, body) => {
    if (!record?.email) return toast.error('No email on file');
    const params = new URLSearchParams({ subject: subject || 'Iconic Estates India — Your Property Enquiry', body: body || '' });
    window.open(`mailto:${record.email}?${params.toString()}`, '_self');
    touch(() => crmAPI.logContact(entityType, id, 'Email'));
  };

  const email = () => emailMailtoFallback();

  const sendEmailTemplate = async (template) => {
    if (!record?.email) return toast.error('No email on file');
    const subject = fillTemplate(template.subject, record);
    const body = fillTemplate(template.body, record);
    setShowEmailTemplates(false);

    if (!smtpConfigured) {
      // No SMTP configured on the server — open the user's own mail client instead.
      emailMailtoFallback(subject, body);
      return;
    }
    try {
      await templatesAPI.sendEmail(entityType, id, { template_id: template.id });
      toast.success(`Email sent to ${record.email}`);
      load(); onChanged?.();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Send failed — opening your mail client instead');
      emailMailtoFallback(subject, body);
    }
  };

  const shareLocation = () => {
    const q = record?.property_city || record?.city || '';
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(q)}`, '_blank');
    touch(() => crmAPI.logContact(entityType, id, 'Location Shared'));
  };

  const sendBrochure = () => {
    toast.success('Brochure share logged — attach the PDF via WhatsApp/email.');
    touch(() => crmAPI.logContact(entityType, id, 'Brochure Sent'));
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    await crmAPI.addNote(entityType, id, noteText.trim());
    setNoteText('');
    toast.success('Note added');
    load();
  };

  const deleteNote = async (noteId) => {
    await crmAPI.deleteNote(noteId);
    load();
  };

  const submitFollowup = async () => {
    if (!followupForm.due_date) return toast.error('Pick a date/time');
    await crmAPI.addFollowup(entityType, id, followupForm);
    toast.success('Follow-up scheduled');
    setFollowupForm({ type: 'Call', due_date: '', notes: '' });
    setShowFollowupForm(false);
    load();
  };

  const markFollowup = async (followupId, status) => {
    await crmAPI.updateFollowup(followupId, status);
    load();
  };

  const assignTo = async (userId) => {
    if (!userId) return;
    await crmAPI.assign(entityType, id, userId);
    toast.success('Lead assigned');
    load(); onChanged?.();
  };

  const changeStatus = async (status) => {
    await crmAPI.updateStatus(entityType, id, status);
    toast.success('Status updated');
    load(); onChanged?.();
  };

  const changeScore = async (score) => {
    await crmAPI.updateScore(entityType, id, score);
    load();
  };

  // Site Visits
  const submitVisit = async () => {
    if (!visitForm.visit_date) return toast.error('Pick a visit date');
    await crmAPI.addVisit(entityType, id, visitForm);
    toast.success('Site visit scheduled');
    setVisitForm({ visit_date: '', visit_time: '', driver_name: '', driver_phone: '', pickup_address: '', executive_id: '', vehicle_number: '', notes: '' });
    setShowVisitForm(false);
    loadExtras(); load(); onChanged?.();
  };
  const changeVisitStatus = async (visitId, visit_status) => {
    await crmAPI.updateVisit(visitId, { visit_status });
    toast.success('Visit updated');
    loadExtras(); load(); onChanged?.();
  };
  const removeVisit = async (visitId) => {
    await crmAPI.deleteVisit(visitId);
    loadExtras();
  };

  // Documents
  const uploadDoc = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);
      await crmAPI.uploadDocument(entityType, id, formData);
      toast.success('Document uploaded');
      loadExtras();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload failed');
    }
    setUploading(false);
  };
  const removeDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    await crmAPI.deleteDocument(docId);
    loadExtras();
  };

  // Preferences
  const savePrefs = async () => {
    setPrefsSaving(true);
    try {
      await crmAPI.savePreferences(entityType, id, prefs);
      toast.success('Preferences saved');
    } catch (e) {
      toast.error('Could not save preferences');
    }
    setPrefsSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 2100, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--ink)', width: '100%', maxWidth: 520, height: '100%', overflowY: 'auto',
        borderLeft: '1px solid rgba(201,162,75,.25)', boxShadow: '-20px 0 60px rgba(0,0,0,.5)',
      }}>
        {/* Header */}
        <div style={{ padding: 24, borderBottom: '1px solid rgba(201,162,75,.15)', position: 'sticky', top: 0, background: 'var(--ink)', zIndex: 5 }}>
          <div className="flex-between">
            <span className="badge badge-gold" style={{ textTransform: 'capitalize' }}>{entityType}</span>
            <button onClick={onClose}><X size={20} style={{ color: 'var(--mist)' }} /></button>
          </div>
          {record && (
            <div className="flex gap-12" style={{ marginTop: 14, alignItems: 'center' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,var(--gold),var(--gold-dk))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--ink)', fontSize: '1.1rem',
              }}>{initials(record.full_name)}</div>
              <div>
                <div className="h4" style={{ marginBottom: 2 }}>{record.full_name}</div>
                <div style={{ color: 'var(--mist)', fontSize: '.85rem' }}>{record.mobile_number}</div>
              </div>
            </div>
          )}
        </div>

        {loading && <div className="loading-center" style={{ padding: 60 }}><div className="spinner" /></div>}

        {!loading && record && (
          <div style={{ padding: 24 }}>
            {/* Contact action buttons */}
            <div className="flex gap-8" style={{ flexWrap: 'wrap', marginBottom: 24, position: 'relative' }}>
              <button className="btn btn-gold btn-sm" onClick={call}><Phone size={14} /> Call</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowWaTemplates(s => !s); setShowEmailTemplates(false); }}>
                <MessageCircle size={14} /> WhatsApp <ChevronDown size={12} />
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowEmailTemplates(s => !s); setShowWaTemplates(false); }}>
                <Mail size={14} /> Email <ChevronDown size={12} />
              </button>
              <button className="btn btn-ghost btn-sm" onClick={shareLocation}><MapPin size={14} /> Location</button>
              <button className="btn btn-ghost btn-sm" onClick={sendBrochure}><FileText size={14} /> Brochure</button>

              {showWaTemplates && (
                <div style={{
                  position: 'absolute', top: 40, left: 0, background: 'var(--ink)', border: '1px solid rgba(201,162,75,.3)',
                  borderRadius: 8, padding: 8, zIndex: 10, minWidth: 220, boxShadow: '0 10px 30px rgba(0,0,0,.5)',
                }}>
                  <div onClick={() => whatsapp(null)} style={{ padding: '8px 10px', cursor: 'pointer', fontSize: '.8rem', color: 'var(--mist)' }}>Open chat (no template)</div>
                  {waTemplates.map(t => (
                    <div key={t.id} onClick={() => whatsapp(t)}
                      style={{ padding: '8px 10px', cursor: 'pointer', fontSize: '.83rem', borderTop: '1px solid rgba(201,162,75,.1)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,162,75,.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {t.name}
                    </div>
                  ))}
                  {waTemplates.length === 0 && <div style={{ padding: '8px 10px', fontSize: '.78rem', color: 'var(--mist)' }}>No templates yet — add some under Templates.</div>}
                </div>
              )}

              {showEmailTemplates && (
                <div style={{
                  position: 'absolute', top: 40, left: 92, background: 'var(--ink)', border: '1px solid rgba(201,162,75,.3)',
                  borderRadius: 8, padding: 8, zIndex: 10, minWidth: 240, boxShadow: '0 10px 30px rgba(0,0,0,.5)',
                }}>
                  <div onClick={email} style={{ padding: '8px 10px', cursor: 'pointer', fontSize: '.8rem', color: 'var(--mist)' }}>Open mail client (no template)</div>
                  {emailTemplates.map(t => (
                    <div key={t.id} onClick={() => sendEmailTemplate(t)}
                      style={{ padding: '8px 10px', cursor: 'pointer', fontSize: '.83rem', borderTop: '1px solid rgba(201,162,75,.1)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,162,75,.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {t.name}
                    </div>
                  ))}
                  {emailTemplates.length === 0 && <div style={{ padding: '8px 10px', fontSize: '.78rem', color: 'var(--mist)' }}>No templates yet — add some under Templates.</div>}
                  <div style={{ padding: '8px 10px', fontSize: '.7rem', color: 'var(--mist)', borderTop: '1px solid rgba(201,162,75,.1)' }}>
                    {smtpConfigured ? 'Sends directly via server email' : 'SMTP not configured — opens your mail client'}
                  </div>
                </div>
              )}
            </div>

            {/* Status flow */}
            <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
              <div className="form-label" style={{ marginBottom: 10 }}>Status</div>
              <select className="form-select" value={record.status} onChange={e => changeStatus(e.target.value)}>
                {STATUS_FLOW.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 mb-24" style={{ borderBottom: '1px solid rgba(201,162,75,.15)', flexWrap: 'wrap' }}>
              {['profile', 'notes', 'followups', 'visits', 'documents', 'preferences', 'messages', 'activity'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{
                    background: 'transparent', border: 'none', padding: '8px 4px', marginRight: 16, cursor: 'pointer',
                    textTransform: 'capitalize', color: tab === t ? 'var(--gold)' : 'var(--mist)',
                    borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent', fontWeight: 600, fontSize: '.85rem',
                  }}>{t === 'followups' ? 'Follow-ups' : t === 'visits' ? 'Site Visits' : t}</button>
              ))}
            </div>

            {/* PROFILE TAB */}
            {tab === 'profile' && (
              <div>
                <Field label="Email" value={record.email} />
                <Field label="Property Interested In" value={record.property_title || record.property_type} />
                <Field label="Budget" value={record.budget} gold />
                <Field label="City" value={record.city || record.property_city} />
                <Field label="Preferred Visit Date" value={record.preferred_visit_date ? new Date(record.preferred_visit_date).toLocaleDateString('en-IN') : (record.preferred_date ? new Date(record.preferred_date).toLocaleDateString('en-IN') : null)} />
                <Field label="Source" value={record.source_page || record.inquiry_type} />
                <Field label="Created" value={fmtDateTime(record.created_at)} />
                <Field label="Last Contact" value={fmtDateTime(record.last_contact_date)} />

                <div style={{ marginTop: 18 }}>
                  <div className="form-label" style={{ marginBottom: 8 }}>Assigned Executive</div>
                  <select className="form-select" value={record.assigned_to || ''} onChange={e => assignTo(e.target.value)}>
                    <option value="">Unassigned</option>
                    {executives.map(ex => <option key={ex.id} value={ex.id}>{ex.name} ({ex.role})</option>)}
                  </select>
                  <span className="badge badge-mist" style={{ marginTop: 8, display: 'inline-block' }}>{record.assignment_status || 'Unassigned'}</span>
                </div>

                <div style={{ marginTop: 18 }}>
                  <div className="form-label" style={{ marginBottom: 8 }}><Star size={12} style={{ verticalAlign: -1 }} /> Lead Score ({record.lead_score || 0}/100)</div>
                  <input type="range" min="0" max="100" value={record.lead_score || 0}
                    onChange={e => setData(d => ({ ...d, record: { ...d.record, lead_score: e.target.value } }))}
                    onMouseUp={e => changeScore(e.target.value)}
                    onTouchEnd={e => changeScore(e.target.value)}
                    style={{ width: '100%' }} />
                </div>
              </div>
            )}

            {/* NOTES TAB */}
            {tab === 'notes' && (
              <div>
                <div className="flex gap-8" style={{ marginBottom: 16 }}>
                  <textarea className="form-textarea" placeholder="Write an internal note…" value={noteText}
                    onChange={e => setNoteText(e.target.value)} style={{ flex: 1, minHeight: 70 }} />
                </div>
                <button className="btn btn-gold btn-sm" onClick={addNote} style={{ marginBottom: 20 }}><Plus size={14} /> Add Note</button>

                {(!data.notes || data.notes.length === 0) && <p style={{ color: 'var(--mist)' }}>No notes yet.</p>}
                {data.notes?.map(n => (
                  <div key={n.id} className="admin-card" style={{ padding: 14, marginBottom: 10 }}>
                    <div className="flex-between" style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, color: 'var(--gold)', fontSize: '.83rem' }}>{n.admin_name}</span>
                      <div className="flex gap-8" style={{ alignItems: 'center' }}>
                        <span style={{ color: 'var(--mist)', fontSize: '.72rem' }}>{fmtDateTime(n.created_at)}</span>
                        <Trash2 size={13} style={{ cursor: 'pointer', color: 'var(--mist)' }} onClick={() => deleteNote(n.id)} />
                      </div>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '.88rem' }}>{n.note}</div>
                  </div>
                ))}
              </div>
            )}

            {/* FOLLOW-UPS TAB */}
            {tab === 'followups' && (
              <div>
                <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => setShowFollowupForm(s => !s)}>
                  <Plus size={14} /> Schedule Follow-up
                </button>

                {showFollowupForm && (
                  <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Type</label>
                      <select className="form-select" value={followupForm.type} onChange={e => setFollowupForm(f => ({ ...f, type: e.target.value }))}>
                        {FOLLOWUP_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Due Date & Time</label>
                      <input className="form-input" type="datetime-local" value={followupForm.due_date}
                        onChange={e => setFollowupForm(f => ({ ...f, due_date: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Notes</label>
                      <input className="form-input" value={followupForm.notes}
                        onChange={e => setFollowupForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Call again — budget confirmation" />
                    </div>
                    <button className="btn btn-gold btn-sm" onClick={submitFollowup}>Save Follow-up</button>
                  </div>
                )}

                {(!data.followups || data.followups.length === 0) && <p style={{ color: 'var(--mist)' }}>No follow-ups scheduled.</p>}
                {data.followups?.map(f => (
                  <div key={f.id} className="admin-card" style={{ padding: 14, marginBottom: 10 }}>
                    <div className="flex-between">
                      <div>
                        <span className="badge badge-gold" style={{ marginRight: 8 }}>{f.type}</span>
                        <span style={{ fontSize: '.85rem' }}>{fmtDateTime(f.due_date)}</span>
                      </div>
                      <span className={`badge ${f.status === 'Completed' ? 'badge-gold' : 'badge-mist'}`}>{f.status}</span>
                    </div>
                    {f.notes && <div style={{ marginTop: 6, fontSize: '.83rem', color: 'var(--mist)' }}>{f.notes}</div>}
                    {f.status === 'Pending' && (
                      <div className="flex gap-8" style={{ marginTop: 10 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => markFollowup(f.id, 'Completed')}><CheckCircle2 size={12} /> Mark Done</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => markFollowup(f.id, 'Cancelled')}>Cancel</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* SITE VISITS TAB */}
            {tab === 'visits' && (
              <div>
                <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => setShowVisitForm(s => !s)}>
                  <Plus size={14} /> Schedule Site Visit
                </button>

                {showVisitForm && (
                  <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Visit Date</label>
                      <input className="form-input" type="date" value={visitForm.visit_date} onChange={e => setVisitForm(f => ({ ...f, visit_date: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Visit Time</label>
                      <input className="form-input" type="time" value={visitForm.visit_time} onChange={e => setVisitForm(f => ({ ...f, visit_time: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Executive</label>
                      <select className="form-select" value={visitForm.executive_id} onChange={e => setVisitForm(f => ({ ...f, executive_id: e.target.value }))}>
                        <option value="">— Select —</option>
                        {executives.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Driver Name</label>
                      <input className="form-input" value={visitForm.driver_name} onChange={e => setVisitForm(f => ({ ...f, driver_name: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Driver Phone</label>
                      <input className="form-input" value={visitForm.driver_phone} onChange={e => setVisitForm(f => ({ ...f, driver_phone: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Pickup Address</label>
                      <input className="form-input" value={visitForm.pickup_address} onChange={e => setVisitForm(f => ({ ...f, pickup_address: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Vehicle Number</label>
                      <input className="form-input" value={visitForm.vehicle_number} onChange={e => setVisitForm(f => ({ ...f, vehicle_number: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Notes</label>
                      <input className="form-input" value={visitForm.notes} onChange={e => setVisitForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <button className="btn btn-gold btn-sm" onClick={submitVisit}>Save Visit</button>
                  </div>
                )}

                {visits.length === 0 && <p style={{ color: 'var(--mist)' }}>No site visits scheduled.</p>}
                {visits.map(v => (
                  <div key={v.id} className="admin-card" style={{ padding: 14, marginBottom: 10 }}>
                    <div className="flex-between">
                      <div style={{ fontWeight: 600, fontSize: '.88rem' }}>
                        {new Date(v.visit_date).toLocaleDateString('en-IN')} {v.visit_time || ''}
                      </div>
                      <select value={v.visit_status} onChange={e => changeVisitStatus(v.id, e.target.value)}
                        className="form-select" style={{ width: 'auto', padding: '4px 8px', fontSize: '.78rem' }}>
                        {VISIT_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ fontSize: '.8rem', color: 'var(--mist)', marginTop: 6 }}>
                      {v.executive_name && <div><UserCheck size={11} style={{ verticalAlign: -1 }} /> {v.executive_name}</div>}
                      {v.driver_name && <div><Car size={11} style={{ verticalAlign: -1 }} /> {v.driver_name} {v.driver_phone && `· ${v.driver_phone}`} {v.vehicle_number && `· ${v.vehicle_number}`}</div>}
                      {v.pickup_address && <div><MapPin size={11} style={{ verticalAlign: -1 }} /> {v.pickup_address}</div>}
                      {v.notes && <div style={{ marginTop: 4 }}>{v.notes}</div>}
                    </div>
                    <Trash2 size={13} style={{ cursor: 'pointer', color: 'var(--mist)', marginTop: 8 }} onClick={() => removeVisit(v.id)} />
                  </div>
                ))}
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {tab === 'documents' && (
              <div>
                <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Document Type</label>
                    <select className="form-select" value={docType} onChange={e => setDocType(e.target.value)}>
                      {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <label className="btn btn-gold btn-sm" style={{ cursor: uploading ? 'wait' : 'pointer', display: 'inline-flex' }}>
                    <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload File'}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
                      disabled={uploading} onChange={e => uploadDoc(e.target.files[0])} />
                  </label>
                  <div style={{ fontSize: '.72rem', color: 'var(--mist)', marginTop: 8 }}>PDF, JPG, PNG, or WEBP — up to 10MB</div>
                </div>

                {documents.length === 0 && <p style={{ color: 'var(--mist)' }}>No documents uploaded.</p>}
                {documents.map(d => (
                  <div key={d.id} className="admin-card" style={{ padding: 12, marginBottom: 8 }}>
                    <div className="flex-between">
                      <a href={`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}${d.file_url}`} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '.85rem' }}>
                        <FileText size={13} style={{ verticalAlign: -1 }} /> {d.doc_type}
                      </a>
                      <Trash2 size={13} style={{ cursor: 'pointer', color: 'var(--mist)' }} onClick={() => removeDoc(d.id)} />
                    </div>
                    <div style={{ fontSize: '.72rem', color: 'var(--mist)', marginTop: 4 }}>
                      Uploaded by {d.uploaded_by_name} · {fmtDateTime(d.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PREFERENCES TAB */}
            {tab === 'preferences' && (
              <div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label"><Home size={12} style={{ verticalAlign: -1 }} /> Preferred Location</label>
                  <input className="form-input" value={prefs.preferred_location || ''} onChange={e => setPrefs(p => ({ ...p, preferred_location: e.target.value }))} />
                </div>
                <div className="flex gap-8" style={{ marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label"><IndianRupee size={12} style={{ verticalAlign: -1 }} /> Budget Min</label>
                    <input className="form-input" type="number" value={prefs.budget_min || ''} onChange={e => setPrefs(p => ({ ...p, budget_min: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Budget Max</label>
                    <input className="form-input" type="number" value={prefs.budget_max || ''} onChange={e => setPrefs(p => ({ ...p, budget_max: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Bedrooms</label>
                  <select className="form-select" value={prefs.bedrooms || ''} onChange={e => setPrefs(p => ({ ...p, bedrooms: e.target.value }))}>
                    <option value="">— Select —</option>
                    {BEDROOM_OPTS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Amenities (comma separated)</label>
                  <input className="form-input" value={prefs.amenities || ''} onChange={e => setPrefs(p => ({ ...p, amenities: e.target.value }))} placeholder="Pool, Gym, Clubhouse" />
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Purpose</label>
                  <select className="form-select" value={prefs.purpose || 'Self Use'} onChange={e => setPrefs(p => ({ ...p, purpose: e.target.value }))}>
                    <option>Self Use</option>
                    <option>Investment</option>
                  </select>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!prefs.loan_required} onChange={e => setPrefs(p => ({ ...p, loan_required: e.target.checked }))} />
                  <span style={{ fontSize: '.85rem' }}>Loan Required</span>
                </label>
                <button className="btn btn-gold btn-sm" onClick={savePrefs} disabled={prefsSaving}>{prefsSaving ? 'Saving…' : 'Save Preferences'}</button>
              </div>
            )}

            {/* MESSAGES TAB — chat with the customer via the portal */}
            {tab === 'messages' && (
              <div>
                <div style={{ marginBottom: 16, maxHeight: 320, overflowY: 'auto' }}>
                  {messages.length === 0 && <p style={{ color: 'var(--mist)' }}>No messages yet.</p>}
                  {messages.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'admin' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                      <div style={{
                        maxWidth: '75%', padding: '10px 14px', borderRadius: 10,
                        background: m.sender === 'admin' ? 'var(--gold)' : 'rgba(255,255,255,.06)',
                        color: m.sender === 'admin' ? 'var(--ink)' : 'var(--white)',
                      }}>
                        <div style={{ fontSize: '.85rem' }}>{m.message}</div>
                        <div style={{ fontSize: '.68rem', opacity: 0.7, marginTop: 4 }}>{m.sender === 'admin' ? m.sender_name : record.full_name} · {fmtDateTime(m.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-8">
                  <input className="form-input" value={msgText} onChange={e => setMsgText(e.target.value)}
                    placeholder="Reply to customer…" onKeyDown={e => e.key === 'Enter' && (async () => { if (msgText.trim()) { await crmAPI.sendMessage(entityType, id, msgText.trim()); setMsgText(''); loadExtras(); } })()} />
                  <button className="btn btn-gold btn-sm" onClick={async () => { if (!msgText.trim()) return; await crmAPI.sendMessage(entityType, id, msgText.trim()); setMsgText(''); loadExtras(); }}>Send</button>
                </div>
              </div>
            )}

            {/* ACTIVITY TAB */}
            {tab === 'activity' && (
              <div style={{ position: 'relative', paddingLeft: 20 }}>
                <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 2, background: 'rgba(201,162,75,.2)' }} />
                {(!data.activity || data.activity.length === 0) && <p style={{ color: 'var(--mist)' }}>No activity yet.</p>}
                {data.activity?.map(a => (
                  <div key={a.id} style={{ position: 'relative', marginBottom: 18 }}>
                    <div style={{ position: 'absolute', left: -20, top: 4, width: 10, height: 10, borderRadius: '50%', background: 'var(--gold)' }} />
                    <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{a.activity_type}</div>
                    {a.description && <div style={{ fontSize: '.8rem', color: 'var(--mist)' }}>{a.description}</div>}
                    <div style={{ fontSize: '.72rem', color: 'var(--mist)', marginTop: 2 }}>
                      <Clock size={10} style={{ verticalAlign: -1 }} /> {fmtDateTime(a.created_at)} {a.admin_name && <> · <UserCheck size={10} style={{ verticalAlign: -1 }} /> {a.admin_name}</>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, gold }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="form-label" style={{ marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '.92rem', color: value ? (gold ? 'var(--gold)' : 'var(--white)') : 'var(--mist)' }}>{value || '—'}</div>
    </div>
  );
}
