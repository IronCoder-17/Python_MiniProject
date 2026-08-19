// pages/admin/AdminProperties.js
import React, { useState, useEffect, useCallback } from 'react';
import { propertiesAPI, buildersAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save, Copy, Star, Search } from 'lucide-react';

const BLANK = {
  title:'', category:'Residential', property_type:'Flat', price:'', price_label:'',
  location_area:'', city:'Ahmedabad', state:'Gujarat', area_sqft:'',
  bedrooms:2, bathrooms:2, parking:1, possession_status:'Ready To Move',
  rera_number:'', builder_id:'', luxury_rating:3, description:'',
  amenities:'Clubhouse,Swimming Pool,Gymnasium,24x7 Security,Power Backup',
  hero_image:'', brochure_url:'', video_url:'', virtual_tour_url:'',
  is_featured:0, is_sold:0, is_rented:0,
};

const CITIES = ['Ahmedabad','Gandhinagar','Surat','Vadodara','Rajkot','Mumbai','Pune','Bangalore','Hyderabad','Delhi NCR'];
const CATS   = ['Residential','Commercial','Agricultural','Luxury'];
const TYPES  = ['Villa','Bungalow','Tenament','Flat','Apartment','Penthouse','Duplex','Studio Apartment','Office','Retail Shop','Showroom','Warehouse','Co-working Space','Farmhouse','Agricultural Land','Weekend Home','Ultra Luxury Villa','Luxury Penthouse','Golf Villa','Beach Villa'];
const STATUS = ['Ready To Move','Under Construction','New Launch'];

export default function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [builders,   setBuilders]   = useState([]);
  const [meta,       setMeta]       = useState({ total:0, pages:1 });
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false); // 'add' | 'edit' | false
  const [form,       setForm]       = useState(BLANK);
  const [saving,     setSaving]     = useState(false);
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const load = useCallback(async (p=1) => {
    setLoading(true);
    const params = { page:p, limit:15 };
    if (search)         params.search = search;
    if (statusFilter)   params.status = statusFilter;
    if (categoryFilter) params.category = categoryFilter;
    try {
      const [props, bldrs] = await Promise.all([
        propertiesAPI.list(params),
        buildersAPI.list(),
      ]);
      setProperties(props.data.data);
      setMeta(props.data.meta);
      setBuilders(bldrs.data);
    } catch (err) {
      // The api.js interceptor already redirects to /admin/login on an
      // expired/invalid session; for any other failure, surface it instead
      // of letting the rejection go unhandled.
      const status = err.response?.status;
      const isSessionIssue = status === 401 || (status === 403 && /expired/i.test(err.response?.data?.error || ''));
      if (!isSessionIssue) toast.error(err.response?.data?.error || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => { setPage(1); load(1); }, [load]);

  const openAdd  = ()     => { setForm(BLANK); setModal('add'); };
  const openEdit = (prop) => { setForm({ ...BLANK, ...prop, builder_id: prop.builder_id || '' }); setModal('edit'); };
  const close    = ()     => { setModal(false); setForm(BLANK); };

  const save = async () => {
    if (!form.title || !form.price || !form.city) { toast.error('Title, price and city are required'); return; }
    setSaving(true);
    try {
      if (modal === 'add') {
        await propertiesAPI.create(form);
        toast.success('Property created');
      } else {
        await propertiesAPI.update(form.id, form);
        toast.success('Property updated');
      }
      close(); load(page);
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this property? This cannot be undone.')) return;
    await propertiesAPI.delete(id);
    toast.success('Deleted');
    load(page);
  };

  const duplicate = async (prop) => {
    if (!window.confirm(`Duplicate "${prop.title}"?`)) return;
    const { id, created_at, builder_name, builder_logo, ...rest } = prop;
    try {
      await propertiesAPI.create({ ...rest, title: `${prop.title} (Copy)`, is_featured: 0 });
      toast.success('Listing duplicated');
      load(page);
    } catch { toast.error('Duplicate failed'); }
  };

  const toggleFeatured = async (prop) => {
    try {
      await propertiesAPI.update(prop.id, { is_featured: prop.is_featured ? 0 : 1 });
      setProperties(list => list.map(p => p.id === prop.id ? { ...p, is_featured: prop.is_featured ? 0 : 1 } : p));
      toast.success(prop.is_featured ? 'Removed from featured' : 'Marked as featured');
    } catch { toast.error('Update failed'); }
  };

  const setOutcome = async (prop, field) => {
    // field is 'is_sold' or 'is_rented' — turning one on clears the other
    const turningOn = !prop[field];
    const updates = field === 'is_sold'
      ? { is_sold: turningOn ? 1 : 0, is_rented: 0 }
      : { is_rented: turningOn ? 1 : 0, is_sold: 0 };
    try {
      await propertiesAPI.update(prop.id, updates);
      setProperties(list => list.map(p => p.id === prop.id ? { ...p, ...updates } : p));
      toast.success(turningOn ? `Marked as ${field === 'is_sold' ? 'Sold' : 'Rented'}` : 'Marked as available');
    } catch { toast.error('Update failed'); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex-between mb-32" style={{flexWrap:'wrap', gap:16}}>
        <div>
          <h2 className="display-3" style={{marginBottom:4}}>Properties</h2>
          <p style={{color:'var(--mist)'}}>{meta.total} total properties</p>
        </div>
        <button className="btn btn-gold" onClick={openAdd}><Plus size={16}/> Add Property</button>
      </div>

      {/* Search + filters */}
      <div className="admin-card" style={{marginBottom:20, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center'}}>
        <div style={{position:'relative', flex:'1 1 240px'}}>
          <Search size={15} style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--mist)'}} />
          <input
            className="form-input"
            style={{paddingLeft:36}}
            placeholder="Search by title, area, city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-select" style={{maxWidth:180}} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-select" style={{maxWidth:200}} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || statusFilter || categoryFilter) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); }}>
            Clear
          </button>
        )}
      </div>

      {loading ? <div className="loading-center"><div className="spinner"/></div> : (
        <div className="admin-card" style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Property</th><th>Type</th><th>City</th><th>Price</th><th>Status</th><th>Outcome</th><th>Featured</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{display:'flex', gap:12, alignItems:'center'}}>
                      <img src={p.hero_image} alt="" style={{width:48, height:36, objectFit:'cover', borderRadius:6, background:'rgba(255,255,255,.05)'}} />
                      <div>
                        <div style={{color:'var(--mist)', fontWeight:500, fontSize:'.9rem'}}>{p.title}</div>
                        <div style={{color:'var(--mist)', fontSize:'.75rem'}}>{p.location_area}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-mist">{p.property_type}</span></td>
                  <td>{p.city}</td>
                  <td style={{color:'var(--gold)', fontWeight:600}}>{p.price_label}</td>
                  <td><span className={`badge ${p.possession_status==='Ready To Move' ? 'badge-green' : p.possession_status==='New Launch' ? 'badge-gold' : 'badge-blue'}`}>{p.possession_status}</span></td>
                  <td>
                    <div className="flex gap-6">
                      <button
                        className={`btn btn-sm ${p.is_sold ? 'btn-danger' : 'btn-ghost'}`}
                        onClick={() => setOutcome(p, 'is_sold')}
                        title={p.is_sold ? 'Clear sold status' : 'Mark as sold'}
                        style={{padding:'4px 10px', fontSize:'.72rem'}}
                      >
                        Sold
                      </button>
                      <button
                        className={`btn btn-sm ${p.is_rented ? 'btn-danger' : 'btn-ghost'}`}
                        onClick={() => setOutcome(p, 'is_rented')}
                        title={p.is_rented ? 'Clear rented status' : 'Mark as rented'}
                        style={{padding:'4px 10px', fontSize:'.72rem'}}
                      >
                        Rented
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleFeatured(p)}
                      title={p.is_featured ? 'Remove from featured' : 'Mark as featured'}
                      style={{padding:'6px 8px'}}
                    >
                      <Star size={14} fill={p.is_featured ? 'currentColor' : 'none'} style={{color: p.is_featured ? 'var(--gold)' : 'var(--mist)'}} />
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-8">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} title="Edit"><Edit2 size={13}/></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => duplicate(p)} title="Duplicate listing"><Copy size={13}/></button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(p.id)} title="Delete"><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {meta.pages > 1 && (
            <div className="pagination" style={{marginTop:24}}>
              {Array.from({length:meta.pages},(_,i)=>i+1).map(p => (
                <button key={p} className={`page-btn ${p===page ? 'active':''}`} onClick={() => { setPage(p); load(p); }}>{p}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:24}} onClick={close}>
          <div onClick={e => e.stopPropagation()}
            style={{background:'var(--ink)',border:'1px solid rgba(201,162,75,.2)',borderRadius:'var(--radius-lg)',padding:36,width:'100%',maxWidth:700,maxHeight:'90vh',overflowY:'auto'}}>
            <div className="flex-between mb-24">
              <h3 className="h4">{modal === 'add' ? 'Add New Property' : 'Edit Property'}</h3>
              <button onClick={close}><X size={20} style={{color:'var(--mist)'}}/></button>
            </div>

            <div className="grid-2" style={{gap:16}}>
              {[['title','Title *','text'],['price','Price (₹) *','number'],['price_label','Price Label (e.g. ₹2.5 Cr)','text'],
                ['location_area','Area / Locality *','text'],['area_sqft','Area (Sq.Ft.) *','number'],
                ['bedrooms','Bedrooms','number'],['bathrooms','Bathrooms','number'],['parking','Parking','number'],
                ['rera_number','RERA Number','text'],['luxury_rating','Luxury Rating (1-5)','number'],
                ['hero_image','Hero Image URL','url'],
                ['brochure_url','Brochure PDF URL','url'],['video_url','Video Tour URL','url'],['virtual_tour_url','360° Virtual Tour URL','url'],
              ].map(([k,lbl,type]) => (
                <div key={k} className="form-group">
                  <label className="form-label">{lbl}</label>
                  <input className="form-input" type={type} value={form[k] ?? ''} onChange={e => set(k, e.target.value)} />
                </div>
              ))}
              {[['category','Category',CATS],['property_type','Property Type',TYPES],
                ['city','City',CITIES],['possession_status','Status',STATUS],
              ].map(([k,lbl,opts]) => (
                <div key={k} className="form-group">
                  <label className="form-label">{lbl}</label>
                  <select className="form-select" value={form[k]||''} onChange={e => set(k, e.target.value)}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Builder</label>
                <select className="form-select" value={form.builder_id||''} onChange={e => set('builder_id', e.target.value)}>
                  <option value="">No Builder</option>
                  {builders.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{display:'flex', alignItems:'center', gap:12, paddingTop:24}}>
                <input type="checkbox" id="featured" checked={!!form.is_featured} onChange={e => set('is_featured', e.target.checked ? 1 : 0)} />
                <label htmlFor="featured" className="form-label" style={{margin:0}}>Featured Property</label>
              </div>
            </div>
            <div className="form-group" style={{marginTop:16}}>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description||''} onChange={e => set('description', e.target.value)} style={{minHeight:80}} />
            </div>
            <div className="form-group" style={{marginTop:12}}>
              <label className="form-label">Amenities (comma-separated)</label>
              <input className="form-input" value={form.amenities||''} onChange={e => set('amenities', e.target.value)} />
            </div>

            <div className="flex gap-12 mt-24">
              <button className="btn btn-gold" onClick={save} disabled={saving}>
                <Save size={15}/> {saving ? 'Saving…' : 'Save Property'}
              </button>
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}