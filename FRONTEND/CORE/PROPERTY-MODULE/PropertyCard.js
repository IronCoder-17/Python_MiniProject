// components/PropertyCard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Maximize2, Bed, Bath, Car, Heart, Scale } from 'lucide-react';
import { isWishlisted, toggleWishlist } from '../services/wishlist';
import { isInCompare, toggleCompare, MAX_COMPARE } from '../services/compare';
import toast from 'react-hot-toast';

// High-quality property images by type/category
const PROPERTY_IMAGES = {
  // Residential types
  'Apartment': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
  'Luxury Apartment': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  'Penthouse': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
  'Villa': 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
  'Luxury Villa': 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
  'Bungalow': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'Row House': 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  'Duplex': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'Studio': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  '1 BHK': 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  '2 BHK': 'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&q=80',
  '3 BHK': 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80',
  '4 BHK': 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80',
  'Residential': 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
  // Commercial types
  'Office Space': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  'Commercial': 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
  'Retail Shop': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
  'Showroom': 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80',
  'Warehouse': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
  'Industrial': 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&q=80',
  'Co-Working Space': 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
  // Land
  'Plot': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
  'Land': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
  'Agricultural Land': 'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=800&q=80',
  // Default
  'default': 'https://images.unsplash.com/photo-1600585154340-be616 1a56a0c?w=800&q=80',
};

// Fallback images for categories
const CATEGORY_IMAGES = {
  'residential': 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
  'commercial': 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
  'villa': 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
  'apartment': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
  'office': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  'plot': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
  'penthouse': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
  'bungalow': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
};

function getPropertyImage(hero_image, property_type, category) {
  // Use hero_image if it's a valid URL or a local path (not a placeholder)
  if (
    hero_image &&
    (hero_image.startsWith('http') || hero_image.startsWith('/')) &&
    !hero_image.includes('placehold')
  ) {
    return hero_image;
  }
  // Match by property_type first
  if (property_type && PROPERTY_IMAGES[property_type]) {
    return PROPERTY_IMAGES[property_type];
  }
  // Match by category
  if (category) {
    const catKey = category.toLowerCase();
    for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
      if (catKey.includes(key)) return url;
    }
  }
  // Match by partial property_type keyword
  if (property_type) {
    const pt = property_type.toLowerCase();
    if (pt.includes('villa'))       return CATEGORY_IMAGES['villa'];
    if (pt.includes('apartment'))   return CATEGORY_IMAGES['apartment'];
    if (pt.includes('office'))      return CATEGORY_IMAGES['office'];
    if (pt.includes('commercial'))  return CATEGORY_IMAGES['commercial'];
    if (pt.includes('penthouse'))   return CATEGORY_IMAGES['penthouse'];
    if (pt.includes('bungalow'))    return CATEGORY_IMAGES['bungalow'];
    if (pt.includes('plot') || pt.includes('land')) return CATEGORY_IMAGES['plot'];
    if (pt.includes('studio') || pt.includes('bhk') || pt.includes('flat'))
      return CATEGORY_IMAGES['apartment'];
  }
  return PROPERTY_IMAGES['default'];
}

export default function PropertyCard({ property }) {
  const {
    id, title, property_type, category, price_label, location_area, city, state,
    area_sqft, bedrooms, bathrooms, parking, possession_status, hero_image,
    builder_name, luxury_rating, rera_number, created_at, is_sold, is_rented,
  } = property;

  const [wished, setWished] = useState(() => isWishlisted(id));
  const [compared, setCompared] = useState(() => isInCompare(id));

  const statusColor = {
    'Ready To Move':      'badge-green',
    'Under Construction': 'badge-blue',
    'New Launch':         'badge-gold',
  }[possession_status] || 'badge-mist';

  const imgSrc = getPropertyImage(hero_image, property_type, category);

  const isNew = created_at
    ? (Date.now() - new Date(created_at).getTime()) < 14 * 24 * 60 * 60 * 1000
    : false;

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setWished(toggleWishlist(id));
  };

  const handleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleCompare(id);
    if (result.limitReached) {
      toast.error(`You can compare up to ${MAX_COMPARE} properties at a time`);
      return;
    }
    setCompared(result.added);
  };

  return (
    <div className="property-card">
      <div className="property-img">
        <img
          src={imgSrc}
          alt={title}
          loading="lazy"
          onError={e => { e.target.src = PROPERTY_IMAGES['default']; }}
        />
        <div className="property-img-overlay" />
        {(is_sold || is_rented) && (
          <div className="property-outcome-stamp">{is_sold ? 'SOLD' : 'RENTED'}</div>
        )}
        <button
          type="button"
          className={`fav-btn ${wished ? 'active' : ''}`}
          onClick={handleWishlist}
          aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
          title={wished ? 'Saved' : 'Save property'}
        >
          <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          className={`fav-btn compare-btn ${compared ? 'active' : ''}`}
          onClick={handleCompare}
          aria-label={compared ? 'Remove from compare' : 'Add to compare'}
          title={compared ? 'Added to compare' : 'Add to compare'}
        >
          <Scale size={16} />
        </button>
        <div className="property-img-badges">
          <span className={`badge ${statusColor}`}>{possession_status}</span>
          {luxury_rating >= 4 && <span className="badge badge-gold">Luxury</span>}
          {isNew && <span className="badge badge-green">New</span>}
        </div>
        <div className="property-img-price">
          <span className="property-price">{price_label}</span>
        </div>
      </div>

      <div className="property-body">
        <div className="property-title" title={title}>{title}</div>
        <div className="property-location">
          <MapPin size={13} />
          {location_area}, {city}, {state}
        </div>
        <div className="property-meta">
          {bedrooms > 0 && (
            <div className="property-meta-item">
              <div className="property-meta-val"><Bed size={14} style={{display:'inline'}} /> {bedrooms}</div>
              <div className="property-meta-lbl">Beds</div>
            </div>
          )}
          {bathrooms > 0 && (
            <div className="property-meta-item">
              <div className="property-meta-val"><Bath size={14} style={{display:'inline'}} /> {bathrooms}</div>
              <div className="property-meta-lbl">Baths</div>
            </div>
          )}
          <div className="property-meta-item">
            <div className="property-meta-val"><Maximize2 size={14} style={{display:'inline'}} /> {area_sqft?.toLocaleString()}</div>
            <div className="property-meta-lbl">Sq.Ft.</div>
          </div>
          {parking > 0 && (
            <div className="property-meta-item">
              <div className="property-meta-val"><Car size={14} style={{display:'inline'}} /> {parking}</div>
              <div className="property-meta-lbl">Parking</div>
            </div>
          )}
        </div>
      </div>

      <div className="property-footer">
        <div className="builder-tag">
          {builder_name && <span>By <strong>{builder_name}</strong></span>}
          {rera_number && <div style={{fontSize:'.7rem', marginTop:2}}>RERA: {rera_number}</div>}
        </div>
        <Link to={`/properties/${id}`} className="btn btn-gold btn-sm">View Details</Link>
      </div>
    </div>
  );
}