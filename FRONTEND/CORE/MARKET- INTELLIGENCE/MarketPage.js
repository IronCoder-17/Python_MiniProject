// pages/MarketPage.js
import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, LineChart, Line, Legend,
} from 'recharts';
import { TrendingUp, Building2, Home } from 'lucide-react';

const CITIES = ['Ahmedabad','Mumbai','Bangalore','Pune','Hyderabad','Delhi NCR','Surat','Gandhinagar'];

const MARKET_DATA = {
  Ahmedabad:  { '1Y':9.2,  '3Y':28.5, '5Y':52.0,  '10Y':145.0, yield:3.8, psf:6200,  label:'Ahmedabad Growth Index' },
  Mumbai:     { '1Y':7.5,  '3Y':24.0, '5Y':46.5,  '10Y':128.0, yield:2.9, psf:45000, label:'Mumbai Luxury Index' },
  Bangalore:  { '1Y':8.8,  '3Y':27.2, '5Y':49.0,  '10Y':132.0, yield:4.4, psf:8800,  label:'Bangalore Rental Yield' },
  Pune:       { '1Y':8.1,  '3Y':25.8, '5Y':47.5,  '10Y':121.0, yield:3.6, psf:7600,  label:'Pune Appreciation Rate' },
  Hyderabad:  { '1Y':9.6,  '3Y':30.1, '5Y':55.0,  '10Y':150.0, yield:4.1, psf:7200,  label:'Hyderabad Momentum Index' },
  'Delhi NCR':{ '1Y':7.0,  '3Y':21.5, '5Y':41.0,  '10Y':110.0, yield:2.6, psf:14000, label:'Delhi NCR Prime Index' },
  Surat:      { '1Y':8.5,  '3Y':26.0, '5Y':48.0,  '10Y':130.0, yield:3.5, psf:4200,  label:'Surat Emerging Index' },
  Gandhinagar:{ '1Y':7.8,  '3Y':24.5, '5Y':45.0,  '10Y':122.0, yield:3.3, psf:5000,  label:'Gandhinagar Capital Index' },
};

const TT = { contentStyle:{background:'rgba(7,14,26,.95)',border:'1px solid rgba(201,162,75,.3)',borderRadius:8}, labelStyle:{color:'#C9A24B',fontWeight:600} };

export default function MarketPage() {
  const [period,     setPeriod]     = useState('5Y');
  const [compareA,   setCompareA]   = useState('Ahmedabad');
  const [compareB,   setCompareB]   = useState('Mumbai');

  const chartData = CITIES.map(c => ({ city:c, value: MARKET_DATA[c][period], yield: MARKET_DATA[c].yield }));

  const radarData = ['1Y','3Y','5Y','10Y','yield'].map(k => ({
    metric: k === 'yield' ? 'Rental Yield' : `${k} Growth`,
    [compareA]: MARKET_DATA[compareA]?.[k] || 0,
    [compareB]: MARKET_DATA[compareB]?.[k] || 0,
  }));

  const lineData = [2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026].map((yr,i) => {
    const obj = { year: yr };
    CITIES.slice(0,4).forEach(c => {
      obj[c] = Math.round(MARKET_DATA[c].psf * Math.pow(1 + MARKET_DATA[c]['1Y']/100, i - 5) / 100) * 100;
    });
    return obj;
  });

  return (
    <div style={{paddingTop:72, background:'var(--ink)', minHeight:'100vh'}}>
      {/* Header */}
      <div style={{background:'var(--obsidian)', borderBottom:'1px solid rgba(201,162,75,.1)', padding:'48px 0'}}>
        <div className="container text-center">
          <div className="eyebrow" style={{color:'var(--gold)',letterSpacing:'.15em',textTransform:'uppercase',fontSize:'.75rem',marginBottom:12}}>Data-Driven</div>
          <h1 className="display-2" style={{marginBottom:16,color:'#D4AF37'}}>Market Intelligence</h1>
          <p style={{color:'var(--mist)',maxWidth:560,margin:'0 auto'}}>
            Where capital meets opportunity — real-time growth indices, rental yields, and price trends across India's premium real estate markets.
          </p>
        </div>
      </div>

      <div className="container" style={{padding:'48px 24px'}}>

        {/* Index cards */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:16, marginBottom:48}}>
          {[
            { city:'Ahmedabad', icon:TrendingUp, color:'#C9A24B', label:'Growth Index' },
            { city:'Mumbai',    icon:Building2,  color:'#3498DB', label:'Luxury Index' },
            { city:'Bangalore', icon:Home,       color:'#2ECC71', label:'Rental Yield' },
            { city:'Hyderabad', icon:TrendingUp, color:'#9B59B6', label:'Momentum Index' },
          ].map(({ city, icon:Icon, color, label }) => {
            const d = MARKET_DATA[city];
            return (
              <div key={city} style={{background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'var(--radius-lg)', padding:24}}>
                <div className="flex-between mb-16">
                  <span style={{fontSize:'.8rem', color:'var(--mist)', textTransform:'uppercase', letterSpacing:'.1em'}}>{city}</span>
                  <Icon size={20} style={{color}} />
                </div>
                <div style={{fontFamily:'var(--ff-display)', fontSize:'2.2rem', fontWeight:700, color, marginBottom:4}}>
                  {d['1Y']}%
                </div>
                <div style={{color:'var(--mist)', fontSize:'.8rem', marginBottom:12}}>{label} · 1-Year</div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, borderTop:'1px solid rgba(255,255,255,.07)', paddingTop:12}}>
                  {['3Y','5Y','10Y'].map(p => (
                    <div key={p} style={{textAlign:'center'}}>
                      <div style={{color:'var(--white)', fontWeight:600, fontSize:'.9rem'}}>{d[p]}%</div>
                      <div style={{color:'var(--mist)', fontSize:'.68rem', textTransform:'uppercase'}}>{p}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Growth comparison bar chart */}
        <div style={{background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'var(--radius-lg)', padding:28, marginBottom:32}}>
          <div className="flex-between mb-24" style={{flexWrap:'wrap', gap:16}}>
            <h3 className="h4"style={{ color: '#D4AF37' }}>City Growth Comparison</h3>
            <div className="flex gap-8">
              {['1Y','3Y','5Y','10Y'].map(p => (
                <button key={p} className={`btn btn-sm ${period===p ? 'btn-gold' : 'btn-ghost'}`} onClick={()=>setPeriod(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="city" tick={{fill:'#8B9BAD', fontSize:11}} />
              <YAxis tick={{fill:'#8B9BAD', fontSize:11}} tickFormatter={v=>`${v}%`} />
              <Tooltip {...TT} formatter={v=>[`${v}%`, `${period} Appreciation`]} />
              <Bar dataKey="value" name={`${period} Growth`} fill="#C9A24B" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Price per sqft trend (line chart) */}
        <div style={{background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'var(--radius-lg)', padding:28, marginBottom:32}}>
          <h3 className="h4" style={{marginBottom:20, color: '#D4AF37'}}>Price Per Sq.Ft. Trend (2016–2026)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="year" tick={{fill:'#8B9BAD', fontSize:11}} />
              <YAxis tick={{fill:'#8B9BAD', fontSize:11}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`} />
              <Tooltip {...TT} formatter={v=>[`₹${v.toLocaleString()}/sqft`]} />
              <Legend wrapperStyle={{color:'#8B9BAD', fontSize:12}} />
              {['Ahmedabad','Mumbai','Bangalore','Pune'].map((c,i) => (
                <Line key={c} type="monotone" dataKey={c} stroke={['#C9A24B','#3498DB','#2ECC71','#9B59B6'][i]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* City Comparison (Radar) */}
        <div style={{background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'var(--radius-lg)', padding:28, marginBottom:32}}>
          <div className="flex-between mb-24" style={{flexWrap:'wrap', gap:16}}>
            <h3 className="h4"style={{ color: '#D4AF37' }}>Compare Cities</h3>
            <div className="flex gap-16" style={{flexWrap:'wrap'}}>
              <div className="form-group">
                <label className="form-label">City A</label>
                <select className="form-select" value={compareA} onChange={e=>setCompareA(e.target.value)}>
                  {CITIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">City B</label>
                <select className="form-select" value={compareB} onChange={e=>setCompareB(e.target.value)}>
                  {CITIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, alignItems:'center', flexWrap:'wrap'}}>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,.1)" />
                <PolarAngleAxis dataKey="metric" tick={{fill:'#8B9BAD', fontSize:11}} />
                <PolarRadiusAxis tick={{fill:'#8B9BAD', fontSize:10}} />
                <Radar name={compareA} dataKey={compareA} stroke="#C9A24B" fill="#C9A24B" fillOpacity={0.25} />
                <Radar name={compareB} dataKey={compareB} stroke="#3498DB" fill="#3498DB" fillOpacity={0.2} />
                <Legend wrapperStyle={{color:'#8B9BAD', fontSize:12}} />
                <Tooltip {...TT} />
              </RadarChart>
            </ResponsiveContainer>
            <div>
              {[['Avg PSF', 'psf', '₹'], ['1Y Growth','1Y','','%'], ['3Y Growth','3Y','','%'], ['Rental Yield','yield','','%']].map(([lbl,k,pre,suf]) => (
                <div key={lbl} style={{marginBottom:20}}>
                  <div style={{color:'var(--mist)', fontSize:'.78rem', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>{lbl}</div>
                  <div className="flex gap-24">
                    <div><span style={{color:'#C9A24B', fontWeight:700}}>{pre}{MARKET_DATA[compareA]?.[k]?.toLocaleString()}{suf}</span> <span style={{color:'var(--mist)', fontSize:'.8rem'}}>{compareA}</span></div>
                    <div><span style={{color:'#3498DB', fontWeight:700}}>{pre}{MARKET_DATA[compareB]?.[k]?.toLocaleString()}{suf}</span> <span style={{color:'var(--mist)', fontSize:'.8rem'}}>{compareB}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rental yield bar */}
        <div style={{background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'var(--radius-lg)', padding:28}}>
          <h3 className="h4" style={{marginBottom:20, color: '#D4AF37'}}>Rental Yield Comparison (%)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis type="number" tick={{fill:'#8B9BAD', fontSize:11}} tickFormatter={v=>`${v}%`} />
              <YAxis type="category" dataKey="city" tick={{fill:'#8B9BAD', fontSize:11}} width={80} />
              <Tooltip {...TT} formatter={v=>[`${v}%`, 'Rental Yield']} />
              <Bar dataKey="yield" fill="#2ECC71" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
