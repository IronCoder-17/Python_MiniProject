// pages/CalculatorPage.js — 10-Year Investment Returns Calculator
import React, { useState } from 'react';
import { analyticsAPI } from '../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, Calculator, Info } from 'lucide-react';

const fmt = (v) => {
  if (v >= 1e7) return `₹${(v/1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v/1e5).toFixed(2)} L`;
  return `₹${v.toLocaleString()}`;
};

const TOOLTIP_STYLE = {
  contentStyle: { background:'rgba(7,14,26,.95)', border:'1px solid rgba(201,162,75,.3)', borderRadius:8 },
  labelStyle:   { color:'#C9A24B', fontWeight:600 },
};

export default function CalculatorPage() {
  const [inputs, setInputs] = useState({
    property_price:          10000000,   // ₹1 Crore
    down_payment_pct:        20,
    annual_appreciation_pct: 8,
    annual_rental_yield_pct: 3,
    holding_years:           10,
    loan_interest_rate_pct:  8.5,
  });
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k, v) => setInputs(i => ({ ...i, [k]: Number(v) }));

  const calculate = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await analyticsAPI.calculateROI(inputs);
      setResult(data);
    } catch (e) {
      // Fallback: client-side calculation if Python service is down
      setError('Analytics service unavailable. Showing estimated figures.');
      const price = inputs.property_price;
      const appr  = inputs.annual_appreciation_pct / 100;
      const yld   = inputs.annual_rental_yield_pct / 100;
      const yrs   = inputs.holding_years;
      const fv    = price * Math.pow(1+appr, yrs);
      const rent  = Array.from({length:yrs}, (_,i) => price * yld * Math.pow(1.05, i)).reduce((a,b)=>a+b,0);
      setResult({
        property_price: price,
        down_payment: price * inputs.down_payment_pct/100,
        loan_amount: price * (1 - inputs.down_payment_pct/100),
        future_value: fv,
        total_rental_income: rent,
        total_returns: (fv - price) + rent,
        roi_pct: ((fv - price + rent) / price * 100),
        annualised_roi_pct: ((Math.pow((fv + rent)/price, 1/yrs) - 1)*100),
        wealth_multiple: (fv + rent) / price,
        yearly_breakdown: Array.from({length:yrs}, (_,i) => {
          const yr = i+1;
          const pv = price * Math.pow(1+appr, yr);
          const cr = Array.from({length:yr}, (_,j) => price * yld * Math.pow(1.05,j)).reduce((a,b)=>a+b,0);
          return { year:yr, property_value: pv, cumulative_rental: cr, equity: pv, total_wealth: pv + cr };
        }),
        summary_text: `Estimated — ${fmt(price)} property grows to ${fmt(fv)} over ${yrs} years.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{paddingTop:72, background:'var(--ink)', minHeight:'100vh'}}>
      {/* Header */}
      <div style={{background:'var(--obsidian)', borderBottom:'1px solid rgba(201,162,75,.1)', padding:'48px 0'}}>
        <div className="container text-center">
          <div className="eyebrow" style={{color:'var(--gold)',letterSpacing:'.15em',textTransform:'uppercase',fontSize:'.75rem',marginBottom:12}}>Investment Planning</div>
          <h1 className="display-2" style={{marginBottom:16, color: '#D4AF37'}}>10-Year Returns Calculator</h1>
          <p style={{color:'var(--mist)', maxWidth:560, margin:'0 auto'}}>
            Model your real estate investment returns with appreciation, rental income, and EMI calculations.
          </p>
        </div>
      </div>

      <div className="container" style={{padding:'48px 24px'}}>
        <div style={{display:'grid', gridTemplateColumns: result ? '380px 1fr' : '560px', gap:40, justifyContent:'center', alignItems:'start'}}>

          {/* Input panel */}
          <div className="glass-card" style={{padding:32}}>
            <h3 className="h4" style={{marginBottom:24, display:'flex', alignItems:'center', gap:8}}>
              <Calculator size={20} style={{color:'var(--gold)'}} /> Investment Details
            </h3>

            {[
              {k:'property_price', label:'Property Price', prefix:'₹', min:1000000, max:500000000, step:500000, display: fmt(inputs.property_price)},
              {k:'down_payment_pct', label:'Down Payment', suffix:'%', min:10, max:100, step:5},
              {k:'loan_interest_rate_pct', label:'Loan Interest Rate', suffix:'%', min:5, max:20, step:0.25},
              {k:'annual_appreciation_pct', label:'Annual Appreciation', suffix:'%', min:1, max:30, step:0.5},
              {k:'annual_rental_yield_pct', label:'Annual Rental Yield', suffix:'%', min:0, max:15, step:0.25},
              {k:'holding_years', label:'Holding Period', suffix:' Yrs', min:1, max:30, step:1},
            ].map(({ k, label, prefix, suffix, min, max, step, display }) => (
              <div key={k} className="form-group" style={{marginBottom:20}}>
                <div className="flex-between" style={{marginBottom:4}}>
                  <label className="form-label">{label}</label>
                  <span style={{color:'var(--gold)', fontSize:'.9rem', fontWeight:600}}>
                    {display || `${prefix||''}${inputs[k]}${suffix||''}`}
                  </span>
                </div>
                <input type="range" min={min} max={max} step={step} value={inputs[k]}
                  onChange={e => set(k, e.target.value)}
                  style={{width:'100%', accentColor:'var(--gold)', cursor:'pointer'}} />
                <div className="flex-between" style={{marginTop:4}}>
                  <span style={{color:'var(--mist)', fontSize:'.7rem'}}>{prefix}{min}{suffix}</span>
                  <span style={{color:'var(--mist)', fontSize:'.7rem'}}>{prefix}{max}{suffix}</span>
                </div>
              </div>
            ))}

            <div style={{background:'rgba(201,162,75,.07)', border:'1px solid rgba(201,162,75,.2)', borderRadius:'var(--radius)', padding:14, marginBottom:24, fontSize:'.82rem', color:'var(--mist)'}}>
              <div className="flex gap-8" style={{alignItems:'center', marginBottom:6}}>
                <Info size={14} style={{color:'var(--gold)'}} />
                <strong style={{color:'var(--gold)'}}>Quick Defaults</strong>
              </div>
              Price ₹1 Cr · Appreciation 8% · Rental Yield 3% · 10 Years
            </div>

            <button className="btn btn-gold btn-full btn-lg" onClick={calculate} disabled={loading}>
              {loading ? 'Calculating…' : <><TrendingUp size={18}/> Calculate Returns</>}
            </button>
            {error && <p style={{color:'#F39C12', fontSize:'.8rem', marginTop:12}}>{error}</p>}
          </div>

          {/* Results */}
          {result && (
            <div>
              {/* Summary banner */}
              <div style={{background:'linear-gradient(135deg, rgba(201,162,75,.15), rgba(201,162,75,.05))', border:'1px solid rgba(201,162,75,.3)', borderRadius:'var(--radius-lg)', padding:28, marginBottom:28}}>
                <p style={{color:'var(--mist)', lineHeight:1.8}}>{result.summary_text}</p>
              </div>

              {/* Key metrics grid */}
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28}}>
                {[
                  { label:'Future Value',        val: fmt(result.future_value),       color:'var(--gold)' },
                  { label:'Total Rental Income', val: fmt(result.total_rental_income), color:'#2ECC71' },
                  { label:'Total Returns',        val: fmt(result.total_returns),       color:'var(--gold)' },
                  { label:'ROI',                 val: `${result.roi_pct?.toFixed(1)}%`, color:'#3498DB' },
                  { label:'Annualised ROI',       val: `${result.annualised_roi_pct?.toFixed(1)}% p.a.`, color:'#3498DB' },
                  { label:'Wealth Multiple',      val: `${result.wealth_multiple?.toFixed(1)}×`,         color:'#9B59B6' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'var(--radius)', padding:20, textAlign:'center'}}>
                    <div style={{fontFamily:'var(--ff-display)', fontSize:'1.5rem', fontWeight:700, color, marginBottom:4}}>{val}</div>
                    <div style={{color:'var(--mist)', fontSize:'.75rem', textTransform:'uppercase', letterSpacing:'.08em'}}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Area chart: wealth over time */}
              <div style={{background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'var(--radius-lg)', padding:24, marginBottom:24}}>
                <h4 className="h5" style={{marginBottom:20, color: '#D4AF37'}}>Wealth Growth Over Time</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={result.yearly_breakdown}>
                    <defs>
                      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#C9A24B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#C9A24B" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#2ECC71" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2ECC71" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                    <XAxis dataKey="year" tick={{fill:'#8B9BAD', fontSize:11}} tickFormatter={v => `Yr ${v}`} />
                    <YAxis tick={{fill:'#8B9BAD', fontSize:11}} tickFormatter={v => v>=1e7 ? `${(v/1e7).toFixed(0)}Cr` : `${(v/1e5).toFixed(0)}L`} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [fmt(v)]} />
                    <Legend wrapperStyle={{color:'#8B9BAD', fontSize:12}} />
                    <Area type="monotone" dataKey="property_value"   name="Property Value"    stroke="#C9A24B" fill="url(#goldGrad)"  strokeWidth={2} />
                    <Area type="monotone" dataKey="cumulative_rental" name="Cumulative Rental" stroke="#2ECC71" fill="url(#greenGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="total_wealth"      name="Total Wealth"      stroke="#9B59B6" fill="none"           strokeWidth={2} strokeDasharray="5 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Yearly table */}
              <div style={{background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'var(--radius-lg)', padding:24, overflowX:'auto'}}>
                <h4 className="h5" style={{marginBottom:16, color: '#D4AF37'}}>Year-by-Year Breakdown</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Property Value</th>
                      <th>Cumul. Rental</th>
                      <th>Equity</th>
                      <th>Total Wealth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearly_breakdown.filter((_,i) => i % 2 === 0 || i === result.yearly_breakdown.length-1).map(row => (
                      <tr key={row.year}>
                        <td style={{ color: '#2ECC71' }}>Year {row.year}</td>
                        <td style={{color:'var(--gold)'}}>{fmt(row.property_value)}</td>
                        <td style={{color:'#2ECC71'}}>{fmt(row.cumulative_rental)}</td>
                        <td style={{color:'var(--gold)'}}>{fmt(row.equity)}</td>
                        <td style={{fontWeight:600, color:' #2ECC71'}}>{fmt(row.total_wealth)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
