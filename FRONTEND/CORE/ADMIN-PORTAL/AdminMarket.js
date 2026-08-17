// pages/admin/AdminMarket.js
import React, { useState, useEffect } from 'react';
import { marketAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save, TrendingUp } from 'lucide-react';

const CITIES = [
  'Ahmedabad','Gandhinagar','Surat','Vadodara','Rajkot',
  'Mumbai','Pune','Bangalore','Hyderabad','Delhi NCR',
];

const BLANK = {
  city: 'Ahmedabad',
  avg_price_per_sqft: '',
  yoy_growth_percent: '',
  total_listings: '',
  avg_days_on_market: '',
  report_date: new Date().toISOString().split('T')[0],
  summary: '',
};

export default function AdminMarket() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false); // 'add' | 'edit' | false
  const [form,    setForm]    = useState(BLANK);
  const [saving,  setSaving]  = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await marketAPI.reports();
      setReports(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load market reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = ()      => { setForm(BLANK); setModal('add'); };
  const openEdit = (row)   => { setForm({ ...BLANK, ...row }); setModal('edit'); };
  const close    = ()      => { setModal(false); setForm(BLANK); };
  const set      = (k, v)  => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.city || !form.avg_price_per_sqft || !form.report_date) {
      toast.error('City, price/sqft and report date are required');
      return;
    }
    setSaving(true);
    try {
      if (modal === 'add') {
        await marketAPI.createReport(form);
        toast.success('Report created');
      } else {
        await marketAPI.updateReport(form.id, form);
        toast.success('Report updated');
      }
      close();
      load();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    try {
      await marketAPI.deleteReport(id);
      toast.success('Report deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const growthColor = (val) => {
    const n = parseFloat(val);
    if (isNaN(n)) return 'var(--mist)';
    return n >= 0 ? '#2ECC71' : '#E74C3C';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-32" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 className="display-3" style={{ marginBottom: 4 }}>Market Reports</h2>
          <p style={{ color: 'var(--mist)' }}>{reports.length} city reports</p>
        </div>
        <button className="btn btn-gold" onClick={openAdd}>
          <Plus size={16} /> Add Report
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div className="admin-card" style={{ overflowX: 'auto' }}>
          {reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--mist)' }}>
              <TrendingUp size={40} style={{ color: 'var(--gold)', marginBottom: 16, opacity: .5 }} />
              <p>No market reports yet.</p>
              <p style={{ fontSize: '.83rem', marginTop: 8 }}>
                Click <strong style={{ color: 'var(--gold)' }}>Add Report</strong> to create your first one.
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>City</th>
                  <th>Avg ₹/sqft</th>
                  <th>YoY Growth</th>
                  <th>Total Listings</th>
                  <th>Avg Days on Market</th>
                  <th>Report Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{r.city}</td>
                    <td>₹{Number(r.avg_price_per_sqft).toLocaleString('en-IN')}</td>
                    <td>
                      <span style={{ color: growthColor(r.yoy_growth_percent), fontWeight: 600 }}>
                        {r.yoy_growth_percent != null
                          ? `${r.yoy_growth_percent > 0 ? '+' : ''}${r.yoy_growth_percent}%`
                          : '—'}
                      </span>
                    </td>
                    <td>{r.total_listings ?? '—'}</td>
                    <td>{r.avg_days_on_market ? `${r.avg_days_on_market} days` : '—'}</td>
                    <td style={{ color: 'var(--mist)', fontSize: '.82rem' }}>
                      {r.report_date
                        ? new Date(r.report_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
                        : '—'}
                    </td>
                    <td>
                      <div className="flex gap-8">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => del(r.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:2000,
            display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={close}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background:'var(--ink)', border:'1px solid rgba(201,162,75,.2)',
              borderRadius:'var(--radius-lg)', padding:36, width:'100%', maxWidth:600,
              maxHeight:'90vh', overflowY:'auto' }}
          >
            <div className="flex-between mb-24">
              <h3 className="h4">{modal === 'add' ? 'Add Market Report' : 'Edit Market Report'}</h3>
              <button onClick={close}><X size={20} style={{ color:'var(--mist)' }} /></button>
            </div>

            <div className="grid-2" style={{ gap: 16 }}>
              {/* City */}
              <div className="form-group">
                <label className="form-label">City *</label>
                <select className="form-select" value={form.city} onChange={e => set('city', e.target.value)}>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Report Date */}
              <div className="form-group">
                <label className="form-label">Report Date *</label>
                <input
                  className="form-input" type="date"
                  value={form.report_date || ''}
                  onChange={e => set('report_date', e.target.value)}
                />
              </div>

              {/* Avg Price/sqft */}
              <div className="form-group">
                <label className="form-label">Avg Price / sqft (₹) *</label>
                <input
                  className="form-input" type="number"
                  placeholder="e.g. 5200"
                  value={form.avg_price_per_sqft || ''}
                  onChange={e => set('avg_price_per_sqft', e.target.value)}
                />
              </div>

              {/* YoY Growth */}
              <div className="form-group">
                <label className="form-label">YoY Growth (%)</label>
                <input
                  className="form-input" type="number" step="0.01"
                  placeholder="e.g. 8.5 or -2.3"
                  value={form.yoy_growth_percent || ''}
                  onChange={e => set('yoy_growth_percent', e.target.value)}
                />
              </div>

              {/* Total Listings */}
              <div className="form-group">
                <label className="form-label">Total Listings</label>
                <input
                  className="form-input" type="number"
                  placeholder="e.g. 340"
                  value={form.total_listings || ''}
                  onChange={e => set('total_listings', e.target.value)}
                />
              </div>

              {/* Avg Days on Market */}
              <div className="form-group">
                <label className="form-label">Avg Days on Market</label>
                <input
                  className="form-input" type="number"
                  placeholder="e.g. 45"
                  value={form.avg_days_on_market || ''}
                  onChange={e => set('avg_days_on_market', e.target.value)}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Summary / Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Brief market overview for this city…"
                value={form.summary || ''}
                onChange={e => set('summary', e.target.value)}
                style={{ minHeight: 80 }}
              />
            </div>

            <div className="flex gap-12 mt-24">
              <button className="btn btn-gold" onClick={save} disabled={saving}>
                <Save size={15} /> {saving ? 'Saving…' : 'Save Report'}
              </button>
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}