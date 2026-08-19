// pages/WishlistPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { propertiesAPI } from '../services/api';
import { getWishlist, onWishlistChange } from '../services/wishlist';

export default function WishlistPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const ids = getWishlist();
    if (ids.length === 0) { setProperties([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(ids.map(id => propertiesAPI.get(id).then(r => r.data).catch(() => null)))
      .then(results => setProperties(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    return onWishlistChange(load);
  }, [load]);

  return (
    <div style={{ paddingTop: 72, background: 'var(--ivory)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--white)', borderBottom: '1px solid rgba(201,162,75,.15)', padding: '40px 0' }}>
        <div className="container">
          <div className="eyebrow" style={{ color: 'var(--gold)', letterSpacing: '.15em', textTransform: 'uppercase', fontSize: '.75rem', marginBottom: 8 }}>
            Your Selections
          </div>
          <h1 className="display-3" style={{ color: 'var(--text-main)' }}>Saved Properties</h1>
          {!loading && (
            <p style={{ color: 'var(--mist)', marginTop: 8 }}>
              {properties.length} {properties.length === 1 ? 'property' : 'properties'} saved
            </p>
          )}
        </div>
      </div>

      <div className="container section-sm">
        {loading ? (
          <div className="loading-center" style={{ minHeight: 300 }}><div className="spinner" /></div>
        ) : properties.length === 0 ? (
          <div className="text-center" style={{ padding: '80px 0' }}>
            <div className="icon-circle-lg" style={{ margin: '0 auto 24px' }}>
              <Heart size={28} />
            </div>
            <h3 className="h4" style={{ marginBottom: 8 }}>No saved properties yet</h3>
            <p style={{ color: 'var(--mist)', marginBottom: 24 }}>
              Tap the heart on any listing to save it here for later.
            </p>
            <Link to="/properties" className="btn btn-gold">Browse Properties</Link>
          </div>
        ) : (
          <div className="grid-3">
            {properties.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
