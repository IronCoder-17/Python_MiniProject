// pages/PropertiesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import FilterPanel  from '../components/FilterPanel';
import { propertiesAPI } from '../services/api';

export default function PropertiesPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    city:      searchParams.get('city') || '',
    category:  searchParams.get('category') || '',
    search:    searchParams.get('search') || '',
    sort:      'newest',
  });
  const [properties, setProperties] = useState([]);
  const [meta,       setMeta]       = useState({ total:0, pages:1, page:1 });
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { ...filters, page: p, limit: 12 };
      // strip empty values
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await propertiesAPI.list(params);
      setProperties(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(1); setPage(1); }, [load]);

  const goPage = (p) => { setPage(p); load(p); window.scrollTo(0,0); };

  return (
    <div style={{paddingTop:72, background:'var(--ink)', minHeight:'100vh'}}>
      {/* Page header */}
      <div style={{background:'var(--obsidian)', borderBottom:'1px solid rgba(201,162,75,.1)', padding:'40px 0'}}>
        <div className="container">
          <div className="eyebrow" style={{color:'var(--gold)',letterSpacing:'.15em',textTransform:'uppercase',fontSize:'.75rem',marginBottom:8}}>Explore</div>
          <h1 className="display-3" style={{ color: '#D4AF37' }}>Properties in India</h1>
          {meta.total > 0 && <p style={{color:'var(--mist)',marginTop:8}}>{meta.total.toLocaleString()} properties found</p>}
        </div>
      </div>

      <div className="container section-sm">
        <FilterPanel filters={filters} onChange={setFilters} onSearch={() => load(1)} />

        {loading ? (
          <div className="loading-center" style={{minHeight:400}}><div className="spinner" /></div>
        ) : properties.length === 0 ? (
          <div className="text-center" style={{padding:'80px 0'}}>
            <div style={{fontSize:'3rem',marginBottom:16}}>🏚️</div>
            <h3 className="h4" style={{marginBottom:8}}>No properties found</h3>
            <p style={{color:'var(--mist)'}}>Try adjusting your filters or broadening your search.</p>
          </div>
        ) : (
          <>
            <div className="grid-3">
              {properties.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>

            {/* Pagination */}
            {meta.pages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => goPage(Math.max(1, page-1))} disabled={page===1}>&lsaquo;</button>
                {Array.from({length: meta.pages}, (_,i) => i+1)
                  .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === meta.pages)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && arr[idx-1] !== p-1) acc.push('...');
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) => p === '...'
                    ? <span key={`ellipsis-${i}`} style={{color:'var(--mist)',padding:'0 8px'}}>…</span>
                    : <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => goPage(p)}>{p}</button>
                  )
                }
                <button className="page-btn" onClick={() => goPage(Math.min(meta.pages, page+1))} disabled={page===meta.pages}>&rsaquo;</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
