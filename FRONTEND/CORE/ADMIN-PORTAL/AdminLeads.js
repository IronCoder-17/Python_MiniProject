// pages/admin/AdminLeads.js
import React, { useState, useEffect } from 'react';
import { leadsAPI, downloadBlob, crmAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Download, RefreshCw, SlidersHorizontal, X, Flag } from 'lucide-react';
import CustomerDetailPanel from './CustomerDetailPanel';

const STATUS_OPTS = ['New','Contacted','Qualified','Site Visit Scheduled','Visited','Negotiation','Booking','Payment','Completed','Closed','Lost','Spam'];
const EMPTY_ADV = { city:'', property_type:'', assigned_to:'', source_page:'', date_from:'', date_to:'', followup_pending:'', site_visit:'' };

export default function AdminLeads() {
  const [leads,   setLeads]   = useState([]);
  const [meta,    setMeta]    = useState({ total:0, today:0, page:1 });
  const [page,    setPage]    = useState(1);
  const [filter,  setFilter]  = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showAdv, setShowAdv] = useState(false);
  const [adv, setAdv] = useState(EMPTY_ADV);
  const [executives, setExecutives] = useState([]);

  useEffect(() => { crmAPI.listExecutives().then(({ data }) => setExecutives(data.data)).catch(() => {}); }, []);

  const load = async (p=1) => {
    setLoading(true);
    const params = { page:p, limit:20 };
    if (filter) params.status = filter;
    Object.entries(adv).forEach(([k, v]) => { if (v) params[k] = v; });
    try {
      const { data } = await leadsAPI.list(params);
      setLeads(data.data);
      setMeta(data.meta);
    } catch (err) {
      const status = err.response?.status;
      const isSessionIssue = status === 401 || (status === 403 && /expired/i.test(err.response?.data?.error || ''));
      if (!isSessionIssue) toast.error(err.response?.data?.error || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); setPage(1); }, [filter, adv]);

  const activeAdvCount = Object.values(adv).filter(Boolean).length;

  const updateStatus = async (id, status) => {
    await leadsAPI.updateStatus(id, status);
    toast.success('Status updated');
    load(page);
  };

  const exportCSV = async () => {
    const { data } = await leadsAPI.export();
    downloadBlob(data, 'iconic_estates_leads.csv');
    toast.success('CSV downloaded');
  };

  return (
    <div>
      <div className="flex-between mb-32" style={{flexWrap:'wrap', gap:16}}>
        <div>
          <h2 className="display-3" style={{marginBottom:4}}>Leads</h2>
          <p style={{color:'var(--mist)'}}>{meta.total} total · {meta.today} today</p>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAdv(s => !s)}>
            <SlidersHorizontal size={14}/> Filters {activeAdvCount > 0 && `(${activeAdvCount})`}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => load(page)}><RefreshCw size={14}/> Refresh</button>
          <button className="btn btn-gold btn-sm" onClick={exportCSV}><Download size={14}/> Export CSV</button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdv && (
        <div className="admin-card" style={{ padding: 18, marginBottom: 20 }}>
          <div className="flex-between" style={{ marginBottom: 14 }}>
            <span className="form-label" style={{ margin: 0 }}>Advanced Filters</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setAdv(EMPTY_ADV)}><X size={12}/> Clear</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            <input className="form-input" placeholder="City" value={adv.city} onChange={e => setAdv(a => ({ ...a, city: e.target.value }))} />
            <input className="form-input" placeholder="Property Type" value={adv.property_type} onChange={e => setAdv(a => ({ ...a, property_type: e.target.value }))} />
            <select className="form-select" value={adv.assigned_to} onChange={e => setAdv(a => ({ ...a, assigned_to: e.target.value }))}>
              <option value="">Any Executive</option>
              <option value="unassigned">Unassigned</option>
              {executives.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
            <input className="form-input" placeholder="Source" value={adv.source_page} onChange={e => setAdv(a => ({ ...a, source_page: e.target.value }))} />
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
          <button key={s||'all'} className={`badge ${filter===s ? 'badge-gold' : 'badge-mist'}`}
            style={{cursor:'pointer',padding:'6px 14px',fontSize:'.8rem'}} onClick={() => setFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner"/></div> : (
        <div className="admin-card" style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Mobile</th><th>Email</th><th>City</th>
                <th>Budget</th><th>Type</th><th>Assigned</th><th>Date</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr><td colSpan={11} style={{textAlign:'center', padding:40, color:'var(--mist)'}}>No leads found</td></tr>
              )}
              {leads.map(l => (
                <tr key={l.id} onClick={() => setSelectedId(l.id)} style={{cursor:'pointer'}}>
                  <td style={{color:'var(--mist)'}}>{l.id}</td>
                  <td>{l.full_name}</td>
                  <td>{l.mobile_number}</td>
                  <td style={{color:'var(--mist)'}}>{l.email || '—'}</td>
                  <td>{l.city || '—'}</td>
                  <td style={{color:'var(--gold)'}}>{l.budget || '—'}</td>
                  <td>{l.property_type || '—'}</td>
                  <td style={{color:'var(--mist)', fontSize:'.8rem'}}>{l.assigned_to_name || 'Unassigned'}</td>
                  <td style={{color:'var(--mist)', fontSize:'.78rem'}}>{new Date(l.created_at).toLocaleDateString('en-IN')}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <select
                      value={l.status}
                      onChange={e => updateStatus(l.id, e.target.value)}
                      style={{background:'transparent', border:'none', color: l.status==='New' ? 'var(--gold)' : l.status==='Contacted' ? '#3498DB' : l.status==='Qualified' ? '#2ECC71' : l.status==='Spam' ? '#8A7A5A' : '#8B9BAD', fontWeight:600, cursor:'pointer', outline:'none', fontSize:'.83rem'}}
                    >
                      {STATUS_OPTS.map(s => <option key={s} style={{background:'var(--ink)',color:'var(--white)'}}>{s}</option>)}
                    </select>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {l.status !== 'Spam' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => updateStatus(l.id, 'Spam')}
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
          entityType="lead"
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => load(page)}
        />
      )}
    </div>
  );
}