// components/PropertySearchCard.js
// Premium floating search card used in the homepage hero.
// Tabs map to the real `category` enum in the DB (Residential / Commercial /
// Luxury / Agricultural) rather than a Buy/Rent split the schema doesn't
// support — every tab here returns real, filtered results.
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, IndianRupee, BedDouble } from 'lucide-react';
import { propertiesAPI } from '../services/api';

const TABS = [
  { key: 'Residential',  label: 'Residential' },
  { key: 'Commercial',   label: 'Commercial' },
  { key: 'Luxury',       label: 'Luxury Homes' },
  { key: 'Agricultural', label: 'Land' },
];

const BUDGETS = [
  { label: 'Any Budget',        min: '', max: '' },
  { label: 'Under ₹50 Lakh',    min: '', max: 5000000 },
  { label: '₹50L – ₹1 Crore',   min: 5000000, max: 10000000 },
  { label: '₹1 Cr – ₹3 Cr',     min: 10000000, max: 30000000 },
  { label: '₹3 Cr – ₹10 Cr',    min: 30000000, max: 100000000 },
  { label: 'Above ₹10 Crore',   min: 100000000, max: '' },
];

export default function PropertySearchCard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Residential');
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState('');
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [bedrooms, setBedrooms] = useState('');
  const [keyword, setKeyword] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    propertiesAPI.filterMeta()
      .then(r => setCities((r.data.cities || []).filter(Boolean).sort()))
      .catch(() => setCities(['Ahmedabad', 'Mumbai', 'Bangalore', 'Delhi NCR']));

    try {
      const stored = JSON.parse(localStorage.getItem('iconic_recent_searches') || '[]');
      setRecentSearches(stored.slice(0, 5));
    } catch { /* ignore */ }
  }, []);

  const cityMatches = useMemo(() => {
    if (!city) return [];
    return cities.filter(c => c.toLowerCase().includes(city.toLowerCase())).slice(0, 6);
  }, [city, cities]);

  const saveRecentSearch = (label) => {
    try {
      const stored = JSON.parse(localStorage.getItem('iconic_recent_searches') || '[]');
      const next = [label, ...stored.filter(s => s !== label)].slice(0, 5);
      localStorage.setItem('iconic_recent_searches', JSON.stringify(next));
    } catch { /* ignore */ }
  };

  const handleSearch = () => {
    const budget = BUDGETS[budgetIdx];
    const params = new URLSearchParams();
    params.set('category', activeTab);
    if (city) params.set('city', city);
    if (budget.min) params.set('min_price', budget.min);
    if (budget.max) params.set('max_price', budget.max);
    if (bedrooms) params.set('bedrooms', bedrooms);
    if (keyword) params.set('search', keyword);

    const summary = [TABS.find(t => t.key === activeTab)?.label, city, keyword]
      .filter(Boolean).join(' · ');
    saveRecentSearch(summary || TABS.find(t => t.key === activeTab)?.label);

    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="search-card">
      <div className="search-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`search-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="search-fields">
        <div className="search-field search-field-city">
          <MapPin size={16} className="search-field-icon" />
          <input
            type="text"
            placeholder="City or locality"
            value={city}
            onChange={e => setCity(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            autoComplete="off"
          />
          {showSuggestions && (city ? cityMatches.length > 0 : recentSearches.length > 0) && (
            <div className="search-suggest-dropdown">
              {city ? (
                cityMatches.map(c => (
                  <div key={c} className="search-suggest-item" onMouseDown={() => setCity(c)}>
                    <MapPin size={13} /> {c}
                  </div>
                ))
              ) : (
                <>
                  <div className="search-suggest-label">Recent searches</div>
                  {recentSearches.map((s, i) => (
                    <div
                      key={i}
                      className="search-suggest-item"
                      onMouseDown={() => setKeyword(s)}
                    >
                      <Search size={13} /> {s}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="search-field">
          <IndianRupee size={16} className="search-field-icon" />
          <select value={budgetIdx} onChange={e => setBudgetIdx(Number(e.target.value))}>
            {BUDGETS.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}
          </select>
        </div>

        <div className="search-field">
          <BedDouble size={16} className="search-field-icon" />
          <select value={bedrooms} onChange={e => setBedrooms(e.target.value)}>
            <option value="">Any Beds</option>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+ BHK</option>)}
          </select>
        </div>

        <button type="button" className="btn btn-gold search-submit" onClick={handleSearch}>
          <Search size={17} /> Search
        </button>
      </div>
    </div>
  );
}
