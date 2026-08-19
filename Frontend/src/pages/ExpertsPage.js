// pages/ExpertsPage.js
import React, { useState, useEffect } from 'react';
import { expertsAPI, buildersAPI } from '../services/api';
import { Briefcase, Palette, Home, Building2 } from 'lucide-react';

const TABS = [
  { id:'builders',  label:'Builders',             icon: Building2 },
  { id:'civil',     label:'Civil Engineers',       icon: Briefcase },
  { id:'interior',  label:'Interior Designers',    icon: Palette   },
  { id:'exterior',  label:'Exterior Designers',    icon: Home      },
];

function ExpertCard({ name, photo_url, experience_years, subtitle, detail, city }) {
  return (
    <div style={{background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'var(--radius-lg)', padding:24, transition:'all .3s'}}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor='rgba(201,162,75,.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.borderColor='rgba(255,255,255,.07)'; }}>
      <div style={{display:'flex', gap:16, alignItems:'flex-start', marginBottom:16}}>
        <img src={photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`}
          alt={name} style={{width:64, height:64, borderRadius:'50%', objectFit:'cover', background:'rgba(201,162,75,.1)', border:'2px solid rgba(201,162,75,.3)'}} />
        <div>
          <h4 style={{fontFamily:'var(--ff-display)',fontSize:'1.05rem',marginBottom:4,color:'var(--gold)'}}>
  {name}
</h4>
          {city && <div style={{color:'var(--mist)', fontSize:'.8rem'}}>{city}</div>}
          <div style={{color:'var(--gold)', fontSize:'.8rem', fontWeight:600, marginTop:4}}>
            {experience_years}+ Years Experience
          </div>
        </div>
      </div>
      {subtitle && <div style={{background:'rgba(201,162,75,.07)', borderRadius:'var(--radius-sm)', padding:'8px 12px', fontSize:'.83rem', color:'var(--gold)', marginBottom:12}}>{subtitle}</div>}
      {detail && <p style={{color:'var(--mist)', fontSize:'.85rem', lineHeight:1.6}}>{detail}</p>}
    </div>
  );
}

function BuilderCard({ name, logo_url, years_experience, total_projects, cities_served, description }) {
  return (
    <div style={{background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'var(--radius-lg)', padding:24, transition:'all .3s'}}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor='rgba(201,162,75,.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.borderColor='rgba(255,255,255,.07)'; }}>
      <div style={{height:60, marginBottom:20, display:'flex', alignItems:'center'}}>
        {logo_url
          ? <img src={logo_url} alt={name} style={{maxHeight:50, objectFit:'contain', background:'rgba(255,255,255,.05)', padding:'6px 12px', borderRadius:8}} />
          : <h3 style={{fontFamily:'var(--ff-display)', color:'var(--gold)', fontSize:'1.2rem'}}>{name}</h3>
        }
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16, borderTop:'1px solid rgba(255,255,255,.07)', paddingTop:16}}>
        {[['Years', years_experience+'+'], ['Projects', total_projects+'+'], ['Cities', (cities_served||'').split(',').length]].map(([l,v]) => (
          <div key={l} style={{textAlign:'center'}}>
            <div style={{color:'var(--gold)', fontWeight:700, fontSize:'1.2rem'}}>{v}</div>
            <div style={{color:'var(--mist)', fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.08em'}}>{l}</div>
          </div>
        ))}
      </div>
      {description && <p style={{color:'var(--mist)', fontSize:'.83rem', lineHeight:1.6}}>{description}</p>}
      {cities_served && <div className="tag-row" style={{marginTop:12}}>
        {cities_served.split(',').map(c => <span key={c} className="tag">{c.trim()}</span>)}
      </div>}
    </div>
  );
}

export default function ExpertsPage() {
  const [tab,      setTab]      = useState('builders');
  const [data,     setData]     = useState({});
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (data[tab]) return;
    setLoading(true);
    const req = tab === 'builders'  ? buildersAPI.list()
              : tab === 'civil'     ? expertsAPI.listCivil()
              : tab === 'interior'  ? expertsAPI.listInterior()
              : expertsAPI.listExterior();
    req.then(r => setData(d => ({ ...d, [tab]: r.data }))).finally(() => setLoading(false));
  }, [tab, data]);

  const items = data[tab] || [];

  return (
    <div style={{paddingTop:72, background:'var(--ink)', minHeight:'100vh'}}>
      <div style={{background:'var(--obsidian)', borderBottom:'1px solid rgba(201,162,75,.1)', padding:'48px 0'}}>
        <div className="container text-center">
          <div className="eyebrow" style={{color:'var(--gold)',letterSpacing:'.15em',textTransform:'uppercase',fontSize:'.75rem',marginBottom:12}}>Our Network</div>
          <h1 className="display-2" style={{marginBottom:16, color: '#D4AF37'}}>Real Estate Experts</h1>
          <p style={{color:'var(--mist)', maxWidth:560, margin:'0 auto'}}>
            India's finest builders, engineers, and designers curated to elevate your property journey from concept to keys.
          </p>
        </div>
      </div>

      <div className="container" style={{padding:'48px 24px'}}>
        {/* Tab nav */}
          <div
  style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    paddingBottom: '10px',
    marginBottom: '40px'
  }}
>
  {TABS.map(({ id, label, icon: Icon }) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`btn ${tab === id ? 'btn-gold' : 'btn-ghost'}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  ))}
</div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="text-center" style={{padding:'60px 0'}}>
            <p style={{color:'var(--mist)'}}>No records found. Add some via the Admin panel.</p>
          </div>
        ) : (
          <div className="grid-3">
            {tab === 'builders'
              ? items.map(b => <BuilderCard key={b.id} {...b} />)
              : items.map(e => (
                  <ExpertCard
                    key={e.id}
                    name={e.name}
                    photo_url={e.photo_url}
                    experience_years={e.experience_years}
                    city={e.city}
                    subtitle={tab === 'civil' ? e.specialization : tab === 'interior' ? e.design_style : e.specialty}
                    detail={e.bio}
                  />
                ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
