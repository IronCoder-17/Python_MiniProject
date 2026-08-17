// pages/portal/CustomerPortal.js
import React, { useState, useEffect, useCallback } from 'react';
import { portalAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LogOut, Home, MapPin, FileText, Send, Upload, X, Phone, Mail,
  CheckCircle2, Circle, Download,
} from 'lucide-react';

const STATUS_STEPS = [
  'New','Contacted','Qualified','Site Visit Scheduled','Visited',
  'Negotiation','Booking','Payment','Completed',
];
const DOC_TYPES = ['PAN','Aadhaar','Passport','Income Proof','Booking Form','Agreement','Payment Receipt','Other'];
const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
function fmtDateTime(d) { return d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'; }

export default function CustomerPortal() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // { entity_type, id }
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const { data } = await portalAPI.myRecords();
      setRecords(data.data);
    } catch (e) {
      toast.error('Could not load your enquiries');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const logout = () => {
    localStorage.removeItem('iconic_customer_token');
    navigate('/portal/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink, #070E1A)', color: '#fff' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(201,162,75,.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#C9A24B', fontSize: '1.3rem', margin: 0 }}>Iconic<span style={{color:'#fff'}}>Estates</span> — My Enquiries</h2>
        <button onClick={logout} style={{ background: 'none', border: 'none', color: '#8B9BAD', cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        {loading && <p style={{ color: '#8B9BAD' }}>Loading…</p>}
        {!loading && records.length === 0 && <p style={{ color: '#8B9BAD' }}>No enquiries found for this number.</p>}

        <div style={{ display: 'grid', gap: 14 }}>
          {records.map(r => (
            <div key={`${r.entity_type}-${r.id}`} onClick={() => setSelected({ entity_type: r.entity_type, id: r.id })}
              style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(201,162,75,.15)', borderRadius: 12, padding: 18, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{r.property_title || r.property_type || 'General Enquiry'}</div>
                  <div style={{ color: '#8B9BAD', fontSize: '.83rem', marginTop: 4 }}>
                    <MapPin size={12} style={{ verticalAlign: -1 }} /> {r.property_city || r.city || '—'}
                  </div>
                </div>
                <span style={{ background: 'rgba(201,162,75,.15)', color: '#C9A24B', padding: '4px 12px', borderRadius: 20, fontSize: '.78rem', fontWeight: 600, height: 'fit-content' }}>{r.status}</span>
              </div>
              <div style={{ color: '#8B9BAD', fontSize: '.75rem', marginTop: 10 }}>Submitted {fmtDate(r.created_at)}</div>
            </div>
          ))}
        </div>
      </div>

      {selected && <RecordDetail entityType={selected.entity_type} id={selected.id} onClose={() => setSelected(null)} />}
    </div>
  );
}

function RecordDetail({ entityType, id, onClose }) {
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tab, setTab] = useState('status');
  const [msgText, setMsgText] = useState('');
  const [docType, setDocType] = useState('PAN');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const [r, m, d] = await Promise.all([
      portalAPI.getRecord(entityType, id),
      portalAPI.listMessages(entityType, id),
      portalAPI.listDocuments(entityType, id),
    ]);
    setData(r.data);
    setMessages(m.data.data);
    setDocuments(d.data.data);
  }, [entityType, id]);

  useEffect(() => { load(); }, [load]);

  if (!data) return null;
  const { record, visits } = data;
  const currentStepIdx = STATUS_STEPS.indexOf(record.status);

  const sendMessage = async () => {
    if (!msgText.trim()) return;
    await portalAPI.sendMessage(entityType, id, msgText.trim());
    setMsgText('');
    load();
  };

  const uploadDoc = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);
      await portalAPI.uploadDocument(entityType, id, formData);
      toast.success('Document uploaded');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload failed');
    }
    setUploading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 16px', overflowY: 'auto' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0D1626', border: '1px solid rgba(201,162,75,.25)', borderRadius: 16, width: '100%', maxWidth: 640, color: '#fff' }}>
        <div style={{ padding: 24, borderBottom: '1px solid rgba(201,162,75,.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{record.property_title || record.property_type || 'General Enquiry'}</div>
            <div style={{ color: '#8B9BAD', fontSize: '.83rem', marginTop: 4 }}>{record.property_city || record.city}</div>
            {record.assigned_to_name && (
              <div style={{ color: '#8B9BAD', fontSize: '.8rem', marginTop: 8 }}>
                Your executive: <strong style={{ color: '#C9A24B' }}>{record.assigned_to_name}</strong>
                {record.assigned_to_email && <> · <Mail size={11} style={{ verticalAlign: -1 }} /> {record.assigned_to_email}</>}
              </div>
            )}
          </div>
          <button onClick={onClose}><X size={20} style={{ color: '#8B9BAD' }} /></button>
        </div>

        <div style={{ display: 'flex', gap: 20, padding: '12px 24px', borderBottom: '1px solid rgba(201,162,75,.1)' }}>
          {['status', 'chat', 'documents'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', padding: '8px 0', cursor: 'pointer', textTransform: 'capitalize',
              color: tab === t ? '#C9A24B' : '#8B9BAD', borderBottom: tab === t ? '2px solid #C9A24B' : '2px solid transparent', fontWeight: 600, fontSize: '.85rem',
            }}>{t === 'status' ? 'Status & Visits' : t}</button>
          ))}
        </div>

        <div style={{ padding: 24, maxHeight: '55vh', overflowY: 'auto' }}>
          {tab === 'status' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, opacity: i <= currentStepIdx ? 1 : 0.4 }}>
                    {i <= currentStepIdx ? <CheckCircle2 size={16} style={{ color: '#2ECC71' }} /> : <Circle size={16} style={{ color: '#8B9BAD' }} />}
                    <span style={{ fontSize: '.85rem', fontWeight: i === currentStepIdx ? 700 : 400 }}>{s}</span>
                  </div>
                ))}
                {record.status === 'Lost' && <div style={{ color: '#E74C3C', fontSize: '.85rem', marginTop: 8 }}>This enquiry was marked as not proceeding.</div>}
              </div>

              {record.brochure_url && (
                <a href={`${API_ORIGIN}${record.brochure_url}`} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#C9A24B', fontSize: '.85rem', marginBottom: 20, textDecoration: 'none' }}>
                  <Download size={14} /> Download Brochure
                </a>
              )}

              <h4 style={{ fontSize: '.9rem', marginBottom: 10 }}>Site Visits</h4>
              {(!visits || visits.length === 0) && <p style={{ color: '#8B9BAD', fontSize: '.83rem' }}>No site visits scheduled yet.</p>}
              {visits?.map(v => (
                <div key={v.id} style={{ background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{fmtDate(v.visit_date)} {v.visit_time || ''}</div>
                  <div style={{ color: '#8B9BAD', fontSize: '.78rem', marginTop: 4 }}>
                    Status: {v.visit_status}{v.executive_name && ` · Executive: ${v.executive_name}`}
                    {v.pickup_address && <div><Home size={11} style={{ verticalAlign: -1 }} /> Pickup: {v.pickup_address}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'chat' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                {messages.length === 0 && <p style={{ color: '#8B9BAD', fontSize: '.85rem' }}>No messages yet — say hello to your executive!</p>}
                {messages.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'customer' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                    <div style={{
                      maxWidth: '75%', padding: '10px 14px', borderRadius: 12,
                      background: m.sender === 'customer' ? '#C9A24B' : 'rgba(255,255,255,.06)',
                      color: m.sender === 'customer' ? '#0A1220' : '#fff',
                    }}>
                      <div style={{ fontSize: '.85rem' }}>{m.message}</div>
                      <div style={{ fontSize: '.68rem', opacity: 0.7, marginTop: 4 }}>{m.sender === 'admin' ? m.sender_name : 'You'} · {fmtDateTime(m.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Type a message…"
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(201,162,75,.25)', borderRadius: 8, padding: '10px 12px', color: '#fff', outline: 'none' }} />
                <button onClick={sendMessage} style={{ background: '#C9A24B', border: 'none', borderRadius: 8, padding: '0 16px', cursor: 'pointer' }}><Send size={16} /></button>
              </div>
            </div>
          )}

          {tab === 'documents' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <select value={docType} onChange={e => setDocType(e.target.value)}
                  style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(201,162,75,.25)', borderRadius: 8, padding: '8px 10px', color: '#fff' }}>
                  {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <label style={{ background: '#C9A24B', color: '#0A1220', fontWeight: 600, borderRadius: 8, padding: '8px 14px', cursor: uploading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '.85rem' }}>
                  <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload'}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }} disabled={uploading} onChange={e => uploadDoc(e.target.files[0])} />
                </label>
              </div>
              {documents.length === 0 && <p style={{ color: '#8B9BAD', fontSize: '.85rem' }}>No documents uploaded yet.</p>}
              {documents.map(d => (
                <a key={d.id} href={`${API_ORIGIN}${d.file_url}`} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid rgba(201,162,75,.08)', color: '#C9A24B', textDecoration: 'none', fontSize: '.85rem' }}>
                  <FileText size={14} /> {d.doc_type}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
