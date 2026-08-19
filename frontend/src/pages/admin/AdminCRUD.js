// pages/admin/AdminCRUD.js — Generic CRUD table/modal used by Builders, Engineers, Designers
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

/**
 * Props:
 *   title       string
 *   fetchFn     () => Promise<{data}>
 *   createFn    (data) => Promise
 *   updateFn    (id, data) => Promise
 *   deleteFn    (id) => Promise
 *   fields      [{ key, label, type?, options? }]
 *   blankForm   object
 */
export default function AdminCRUD({ title, fetchFn, createFn, updateFn, deleteFn, fields, blankForm }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false); // 'add' | 'edit'
  const [form,    setForm]    = useState(blankForm);
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    setLoading(true);
    fetchFn().then(r => setItems(r.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd  = ()   => { setForm(blankForm); setModal('add'); };
  const openEdit = (it) => { setForm({ ...blankForm, ...it }); setModal('edit'); };
  const close    = ()   => { setModal(false); setForm(blankForm); };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'add') {
        await createFn(form);
        toast.success('Created successfully');
      } else {
        await updateFn(form.id, form);
        toast.success('Updated successfully');
      }
      close(); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try { await deleteFn(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const displayCols = fields.filter(f => f.showInTable !== false).slice(0, 5);

  return (
    <div>
      <div className="flex-between mb-32" style={{flexWrap:'wrap', gap:16}}>
        <div>
          <h2 className="display-3" style={{marginBottom:4}}>{title}</h2>
          <p style={{color:'var(--mist)'}}>{items.length} records</p>
        </div>
        <button className="btn btn-gold" onClick={openAdd}><Plus size={16}/> Add {title.replace(/s$/, '')}</button>
      </div>

      {loading ? <div className="loading-center"><div className="spinner"/></div> : (
        <div className="admin-card" style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead>
              <tr>
                {displayCols.map(f => <th key={f.key}>{f.label}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={displayCols.length+1} style={{textAlign:'center', padding:40, color:'var(--mist)'}}>
                  No records yet. Click "+ Add" to create one.
                </td></tr>
              )}
              {items.map(it => (
                <tr key={it.id}>
                  {displayCols.map(f => (
                    <td key={f.key}>
                      {f.key === 'photo_url' || f.key === 'logo_url'
                        ? <img src={it[f.key]} alt="" style={{width:40, height:40, objectFit:'cover', borderRadius:f.key==='logo_url'?6:'50%', background:'rgba(255,255,255,.05)'}} />
                        : String(it[f.key] ?? '—')
                      }
                    </td>
                  ))}
                  <td>
                    <div className="flex gap-8">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(it)}><Edit2 size={13}/></button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(it.id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:24}} onClick={close}>
          <div onClick={e => e.stopPropagation()}
            style={{background:'var(--ink)',border:'1px solid rgba(201,162,75,.2)',borderRadius:'var(--radius-lg)',padding:36,width:'100%',maxWidth:620,maxHeight:'88vh',overflowY:'auto'}}>
            <div className="flex-between mb-24">
              <h3 className="h4">{modal==='add' ? `Add ${title.replace(/s$/,'')}` : `Edit ${title.replace(/s$/,'')}`}</h3>
              <button onClick={close}><X size={20} style={{color:'var(--mist)'}}/></button>
            </div>
            <div className="grid-2" style={{gap:16}}>
              {fields.map(f => (
                <div key={f.key} className="form-group" style={f.fullWidth ? {gridColumn:'1/-1'} : {}}>
                  <label className="form-label">{f.label}</label>
                  {f.type === 'select' ? (
                    <select className="form-select" value={form[f.key]||''} onChange={e => set(f.key, e.target.value)}>
                      {f.options?.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea className="form-textarea" value={form[f.key]||''} onChange={e => set(f.key, e.target.value)} />
                  ) : (
                    <input className="form-input" type={f.type||'text'} value={form[f.key]||''} onChange={e => set(f.key, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-12 mt-24">
              <button className="btn btn-gold" onClick={save} disabled={saving}>
                <Save size={15}/> {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
