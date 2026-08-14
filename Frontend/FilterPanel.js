// components/FilterPanel.js
import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const CITIES = ['Ahmedabad','Gandhinagar','Surat','Vadodara','Rajkot','Mumbai','Pune','Bangalore','Hyderabad','Delhi NCR'];
const CATEGORIES = ['Residential','Commercial','Agricultural','Luxury'];
const STATUSES = ['Ready To Move','Under Construction','New Launch'];
const BEDROOMS = [1,2,3,4,5];

export default function FilterPanel({ filters, onChange, onSearch }) {
  const [open, setOpen] = useState(false);

  const set = (k, v) => onChange({ ...filters, [k]: v });
  const clear = () => onChange({});

  return (
    <div className="filter-panel">
      {/* Search bar row */}
      <div className="flex gap-16 mb-16" style={{flexWrap:'wrap'}}>
        <div style={{flex:'1 1 300px', position:'relative'}}>
          <Search size={16} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--mist)'}} />
          <input
            className="form-input"
            style={{paddingLeft:40}}
            placeholder="Search by property name, area or city…"
            value={filters.search || ''}
            onChange={e => set('search', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch?.()}
          />
        </div>
        <button className="btn btn-gold" onClick={onSearch}>Search</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(!open)}>
          <SlidersHorizontal size={15} /> {open ? 'Less' : 'More'} Filters
        </button>
        {Object.values(filters).some(Boolean) && (
          <button className="btn btn-ghost btn-sm" onClick={clear}>
            <X size={14} /> Clear All
          </button>
        )}
      </div>

      {/* Quick pills */}
      <div className="flex gap-8 mb-16" style={{flexWrap:'wrap'}}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`badge ${filters.category === c ? 'badge-gold' : 'badge-mist'}`}
            style={{cursor:'pointer',padding:'6px 14px',fontSize:'.8rem'}}
            onClick={() => set('category', filters.category === c ? '' : c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Expanded filter grid */}
      {open && (
        <div className="filter-grid">
          <div className="form-group">
            <label className="form-label">City</label>
            <select className="form-select" value={filters.city||''} onChange={e => set('city',e.target.value)}>
              <option value="">All Cities</option>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={filters.status||''} onChange={e => set('status',e.target.value)}>
              <option value="">Any Status</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Bedrooms</label>
            <select className="form-select" value={filters.bedrooms||''} onChange={e => set('bedrooms',e.target.value)}>
              <option value="">Any</option>
              {BEDROOMS.map(b => <option key={b} value={b}>{b}+ BHK</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Min Price (₹ Lakh)</label>
            <input className="form-input" type="number" placeholder="e.g. 50"
              value={filters.min_price ? filters.min_price / 100000 : ''}
              onChange={e => set('min_price', e.target.value ? e.target.value * 100000 : '')} />
          </div>

          <div className="form-group">
            <label className="form-label">Max Price (₹ Crore)</label>
            <input className="form-input" type="number" placeholder="e.g. 5"
              value={filters.max_price ? filters.max_price / 10000000 : ''}
              onChange={e => set('max_price', e.target.value ? e.target.value * 10000000 : '')} />
          </div>

          <div className="form-group">
            <label className="form-label">Min Area (Sq.Ft.)</label>
            <input className="form-input" type="number" placeholder="e.g. 1000"
              value={filters.min_area||''} onChange={e => set('min_area', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Sort By</label>
            <select className="form-select" value={filters.sort||'newest'} onChange={e => set('sort',e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="area_desc">Largest First</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Luxury Rating</label>
            <select className="form-select" value={filters.luxury_rating||''} onChange={e => set('luxury_rating',e.target.value)}>
              <option value="">Any</option>
              <option value="5">5 ★ — Ultra Premium</option>
              <option value="4">4+ ★ — Premium</option>
              <option value="3">3+ ★ — Standard</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
