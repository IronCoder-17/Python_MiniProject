// components/RecentlyViewedSection.js
import React, { useEffect, useState } from 'react';
import PropertyCard from './PropertyCard';
import { propertiesAPI } from '../services/api';
import { getRecentlyViewed } from '../services/recentlyViewed';

export default function RecentlyViewedSection({ excludeId }) {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const ids = getRecentlyViewed(excludeId).slice(0, 3);
    if (ids.length === 0) { setProperties([]); return; }
    Promise.all(ids.map(id => propertiesAPI.get(id).then(r => r.data).catch(() => null)))
      .then(results => setProperties(results.filter(Boolean)));
  }, [excludeId]);

  if (properties.length === 0) return null;

  return (
    <section className="section-sm bg-cream">
      <div className="container">
        <div className="section-header" style={{ marginBottom: 32 }}>
          <div className="eyebrow">Pick Up Where You Left Off</div>
          <h2 className="display-3 title">Recently Viewed</h2>
          <div className="gold-divider-center gold-divider" />
        </div>
        <div className="grid-3">
          {properties.map(p => <PropertyCard key={p.id} property={p} />)}
        </div>
      </div>
    </section>
  );
}
