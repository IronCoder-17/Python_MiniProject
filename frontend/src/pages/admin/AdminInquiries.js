// pages/admin/AdminInquiries.js
import React, { useState, useEffect } from 'react';
import { inquiriesAPI, crmAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { SlidersHorizontal, X, Flag } from 'lucide-react';
import CustomerDetailPanel from './CustomerDetailPanel';

const STATUS_OPTS = ['New','Contacted','Qualified','Site Visit Scheduled','Visited','Negotiation','Booking','Payment','Completed','Closed','Lost','Spam'];
const EMPTY_ADV = { city:'', inquiry_type:'', assigned_to:'', date_from:'', date_to:'', followup_pending:'', site_visit:'' };

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [meta,      setMeta]      = useState({total:0, page:1});
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showAdv, setShowAdv] = useState(false);
  const [adv, setAdv] = useState(EMPTY_ADV);
  const [executives, setExecutives] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { crmAPI.listExecutives().then(({ data }) => setExecutives(data.data)).catch(() => {}); }, []);

  const load = async (p=1) => {
    setLoading(true);
    const params = { page:p, limit:20 };
    if (statusFilter) params.status = statusFilter;
    Object.entries(adv).forEach(([k, v]) => { if (v) params[k] = v; });
    try {
      const { data } = await inquiriesAPI.list(params);
      setInquiries(data.data); setMeta(data.meta);
    } catch (err) {
      const status = err.response?.status;
      const isSessionIssue = status === 401 || (status === 403 && /expired/i.test(err.response?.data?.error || ''));
      if (!isSessionIssue) toast.error(err.response?.data?.error || 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); setPage(1); }, [adv, statusFilter]);

  const activeAdvCount = Object.values(adv).filter(Boolean).length;

  const updateStatus = async (id, status) => {
    await inquiriesAPI.updateStatus(id, status);
    toast.success('Status updated'); load(page);
  };

  return (
    <div>
      <div className="flex-between mb-32" style={{flexWrap:'wrap', gap:16}}>
        <div>
          <h2 className="display-3" style={{marginBottom:4}}>Property Inquiries</h2>
          <p style={{color:'var(--mist)'}}>{meta.total} total inquiries</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowAdv(s => !s)}>
          <SlidersHorizontal size={14}/> Filters {activeAdvCount > 0 && `(${activeAdvCount})`}
        </button>
      </div>

      {showAdv && (
        <div className="admin-card" style={{ padding: 18, marginBottom: 20 }}>
          <div className="flex-between" style={{ marginBottom: 14 }}>
            <span className="form-label" style={{ margin: 0 }}>Advanced Filters</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setAdv(EMPTY_ADV)}><X size={12}/> Clear</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            <input className="form-input" placeholder="City" value={adv.city} onChange={e => setAdv(a => ({ ...a, city: e.target.value }))} />
            <input className="form-input" placeholder="Inquiry Type" value={adv.inquiry_type} onChange={e => setAdv(a => ({ ...a, inquiry_type: e.target.value }))} />
            <select className="form-select" value={adv.assigned_to} onChange={e => setAdv(a => ({ ...a, assigned_to: e.target.value }))}>
              <option value="">Any Executive</option>
              <option value="unassigned">Unassigned</option>
              {executives.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
            <input className="form-input" type="date" value={adv.date_from} onChange={e => setAdv(a => ({ ...a, date_from: e.target.value }))} title="From date" />
            <input className="form-input" type="date" value={adv.date_to} onChange={e => setAdv(a => ({ ...a, date_to: e.target.value }))} title="To date" />
            <select className="form-select" value={adv.followup_pending} onChange={e => setAdv(a => ({ ...a, followup_pending: e.target.value }))}>
              <option value="">Follow-up: Any</option>
              <option value="true">Follow-up Pending</option>
            </select>
            <select className="form-select" value={adv.site_visit} onChange={e => setAdv(a => ({ ...a, site_visit: e.target.value }))}>
              <option value="">Site Visit: Any</option>
              <option value="true">Has Site Visit</option>
            </select>
          </div>
        </div>
      )}

      {/* Status filter pills */}
      <div className="flex gap-8 mb-24" style={{flexWrap:'wrap'}}>
        {['', ...STATUS_OPTS].map(s => (
          <button key={s||'all'} className={`badge ${statusFilter===s ? 'badge-gold' : 'badge-mist'}`}
            style={{cursor:'pointer',padding:'6px 14px',fontSize:'.8rem'}} onClick={() => setStatusFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner"/></div> : (
        <div className="admin-card" style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Property</th><th>City</th><th>Type</th>
                <th>Assigned</th><th>Preferred Date</th><th>Date</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {inquiries.length === 0 && (
                <tr><td colSpan={10} style={{textAlign:'center', padding:40, color:'var(--mist)'}}>No inquiries yet</td></tr>
              )}
              {inquiries.map(i => (
                <tr key={i.id} onClick={() => setSelectedId(i.id)} style={{cursor:'pointer'}}>
                  <td style={{color:'var(--mist)'}}>{i.id}</td>
                  <td>
                    <div style={{fontWeight:500}}>{i.full_name}</div>
                    <div style={{color:'var(--mist)', fontSize:'.75rem'}}>{i.mobile_number}</div>
                  </td>
                  <td style={{color:'var(--gold)'}}>{i.property_title || `Property #${i.property_id}`}</td>
                  <td>{i.city || '—'}</td>
                  <td><span className="badge badge-mist">{i.inquiry_type}</span></td>
                  <td style={{color:'var(--mist)', fontSize:'.8rem'}}>{i.assigned_to_name || 'Unassigned'}</td>
                  <td style={{color:'var(--mist)', fontSize:'.83rem'}}>{i.preferred_date ? new Date(i.preferred_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{color:'var(--mist)', fontSize:'.78rem'}}>{new Date(i.created_at).toLocaleDateString('en-IN')}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <select value={i.status} onChange={e => updateStatus(i.id, e.target.value)}
                      style={{background:'transparent',border:'none',fontWeight:600,cursor:'pointer',outline:'none',
                        color: i.status==='New' ? 'var(--gold)' : i.status==='Contacted' ? '#3498DB' : i.status==='Spam' ? '#8A7A5A' : '#2ECC71', fontSize:'.83rem'}}>
                      {STATUS_OPTS.map(s => <option key={s} style={{background:'var(--ink)',color:'var(--white)'}}>{s}</option>)}
                    </select>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {i.status !== 'Spam' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => updateStatus(i.id, 'Spam')}
                        title="Mark as spam"
                        style={{padding:'5px 8px'}}
                      >
                        <Flag size={13} style={{color:'var(--mist)'}} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta.pages > 1 && (
            <div className="pagination" style={{marginTop:24}}>
              {Array.from({length:meta.pages},(_,i)=>i+1).map(p => (
                <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={() => { setPage(p); load(p); }}>{p}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedId && (
        <CustomerDetailPanel
          entityType="inquiry"
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => load(page)}
        />
      )}
    </div>
  );
}