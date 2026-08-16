// pages/ComparePage.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, X, MapPin, Check, Minus } from 'lucide-react';
import { propertiesAPI } from '../services/api';
import { getCompareList, removeFromCompare, onCompareChange } from '../services/compare';

const ROWS = [
  { label: 'Price',            get: p => p.price_label },
  { label: 'Price / Sq.Ft.',   get: p => p.area_sqft ? `₹${Math.round(p.price / p.area_sqft).toLocaleString('en-IN')}` : '—' },
  { label: 'Area',             get: p => `${p.area_sqft?.toLocaleString('en-IN')} sq.ft.` },
  { label: 'Bedrooms',         get: p => p.bedrooms || '—' },
  { label: 'Bathrooms',        get: p => p.bathrooms || '—' },
  { label: 'Parking',          get: p => p.parking || '—' },
  { label: 'Category',         get: p => p.category },
  { label: 'Property Type',    get: p => p.property_type },
  { label: 'Possession',       get: p => p.possession_status },
  { label: 'Location',         get: p => `${p.location_area}, ${p.city}` },
  { label: 'Builder',          get: p => p.builder_name || '—' },
  { label: 'RERA Number',      get: p => p.rera_number || '—' },
  { label: 'Luxury Rating',    get: p => p.luxury_rating ? '★'.repeat(p.luxury_rating) : '—' },
];

export default function ComparePage() {
  const [ids, setIds] = useState(getCompareList());
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => onCompareChange(setIds), []);

  useEffect(() => {
    if (ids.length === 0) { setProperties([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(ids.map(id => propertiesAPI.get(id).then(r => r.data).catch(() => null)))
      .then(results => setProperties(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [ids]);

  const allAmenities = Array.from(new Set(
    properties.flatMap(p => (p.amenities || '').split(',').map(a => a.trim()).filter(Boolean))
  ));

  return (
    <div style={{ paddingTop: 72, background: 'var(--ivory)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--white)', borderBottom: '1px solid rgba(201,162,75,.15)', padding: '40px 0' }}>
        <div className="container">
          <div className="eyebrow" style={{ color: 'var(--gold)', letterSpacing: '.15em', textTransform: 'uppercase', fontSize: '.75rem', marginBottom: 8 }}>
            Side by Side
          </div>
          <h1 className="display-3" style={{ color: 'var(--text-main)' }}>Compare Properties</h1>
        </div>
      </div>

      <div className="container section-sm">
        {loading ? (
          <div className="loading-center" style={{ minHeight: 300 }}><div className="spinner" /></div>
        ) : properties.length < 2 ? (
          <div className="text-center" style={{ padding: '80px 0' }}>
            <div className="icon-circle-lg" style={{ margin: '0 auto 24px' }}><Scale size={28} /></div>
            <h3 className="h4" style={{ marginBottom: 8 }}>
              {properties.length === 0 ? 'No properties selected' : 'Add one more property to compare'}
            </h3>
            <p style={{ color: 'var(--mist)', marginBottom: 24 }}>
              Tap the compare icon on any listing — you need at least 2 to see a side-by-side view.
            </p>
            <Link to="/properties" className="btn btn-gold">Browse Properties</Link>
          </div>
        ) : (
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th className="compare-row-label"></th>
                  {properties.map(p => (
                    <th key={p.id}>
                      <div className="compare-col-header">
                        <button
                          type="button"
                          className="compare-remove"
                          onClick={() => removeFromCompare(p.id)}
                          aria-label="Remove from comparison"
                        >
                          <X size={13} />
                        </button>
                        <img
                          src={p.hero_image || '/images/properties/default.jpg'}
                          alt={p.title}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <div className="compare-col-title">{p.title}</div>
                        <div className="compare-col-loc"><MapPin size={12} /> {p.city}</div>
                        <Link to={`/properties/${p.id}`} className="btn btn-gold btn-sm" style={{ marginTop: 10 }}>
                          View Details
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(row => (
                  <tr key={row.label}>
                    <td className="compare-row-label">{row.label}</td>
                    {properties.map(p => <td key={p.id}>{row.get(p) ?? '—'}</td>)}
                  </tr>
                ))}
                {allAmenities.length > 0 && (
                  <tr>
                    <td className="compare-row-label" colSpan={properties.length + 1} style={{ paddingTop: 24, fontWeight: 700, color: 'var(--text-main)' }}>
                      Amenities
                    </td>
                  </tr>
                )}
                {allAmenities.map(am => (
                  <tr key={am}>
                    <td className="compare-row-label">{am}</td>
                    {properties.map(p => {
                      const has = (p.amenities || '').toLowerCase().includes(am.toLowerCase());
                      return (
                        <td key={p.id} style={{ textAlign: 'center' }}>
                          {has ? <Check size={16} style={{ color: '#2ECC71' }} /> : <Minus size={16} style={{ color: 'var(--mist)' }} />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
