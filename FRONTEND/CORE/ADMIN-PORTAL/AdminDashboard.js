// pages/admin/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { leadsAPI, crmAPI } from '../../services/api';
import { Building2, Mail, TrendingUp, TrendingDown, MessageSquare, Phone, CalendarClock, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  'Ready To Move':      '#2ECC71',
  'Under Construction': '#3498DB',
  'New Launch':         '#C9A24B',
};

function FollowupColumn({ title, icon: Icon, color, items }) {
  const linkFor = (item) => item.entity_type === 'lead' ? '/admin/leads' : '/admin/inquiries';
  return (
    <div className="admin-card">
      <div className="flex gap-8" style={{alignItems:'center', marginBottom:16}}>
        <Icon size={17} style={{color}} />
        <h3 className="h5" style={{margin:0}}>{title}</h3>
        <span className="badge badge-mist" style={{marginLeft:'auto'}}>{items?.length || 0}</span>
      </div>
      {(!items || items.length === 0) && <p style={{color:'var(--mist)', fontSize:'.83rem'}}>Nothing here.</p>}
      {items?.map(f => (
        <Link key={f.id} to={linkFor(f)} style={{display:'block', padding:'10px 0', borderBottom:'1px solid rgba(201,162,75,.10)'}}>
          <div className="flex-between">
            <span style={{fontWeight:600, fontSize:'.85rem'}}>{f.customer_name}</span>
            <span className="badge badge-gold" style={{fontSize:'.7rem'}}>{f.type}</span>
          </div>
          <div style={{color:'var(--mist)', fontSize:'.75rem', marginTop:2}}>
            <Phone size={10} style={{verticalAlign:-1}} /> {f.mobile_number} · {new Date(f.due_date).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [recent,  setRecent]  = useState([]);
  const [followups, setFollowups] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      leadsAPI.dashboard(),
      leadsAPI.list({ limit:6 }),
      crmAPI.followupsDashboard(),
    ]).then(([s, r, f]) => {
      setSummary(s.data);
      setRecent(r.data.data || []);
      setFollowups(f.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner"/></div>;

  const stats = [
    { icon:Building2,    color:'#C9A24B', label:'Total Properties',  val: summary?.total_properties  || '—' },
    { icon:Mail,         color:'#2ECC71', label:'Total Leads',       val: summary?.total_leads       || '—' },
    { icon:TrendingUp,   color:'#3498DB', label:'Today\'s Leads',    val: summary?.todays_leads      || '—' },
    { icon:MessageSquare,color:'#9B59B6', label:'Total Inquiries',   val: summary?.total_inquiries   || '—' },
    { icon:Mail,         color:'#E74C3C', label:'New Leads',         val: summary?.new_leads         || '—' },
  ];

  const chartData = summary?.weekly_trend || [];
  const growth = summary?.monthly_growth_pct ?? 0;
  const statusMix = (summary?.property_status_breakdown || []).map(s => ({
    name: s.possession_status, value: s.c,
  }));

  return (
    <div>
      <div className="flex-between mb-32" style={{flexWrap:'wrap', gap:16}}>
        <div>
          <h2 className="display-3" style={{marginBottom:4}}>Dashboard</h2>
          <p style={{color:'var(--mist)'}}>Overview of your platform's performance</p>
        </div>
        <Link to="/admin/properties/new" className="btn btn-gold">+ Add Property</Link>
      </div>

      {/* Monthly growth banner (real data — % change in leads vs last month) */}
      <div className="admin-card" style={{marginBottom:24, display:'flex', alignItems:'center', gap:14}}>
        {growth >= 0
          ? <TrendingUp size={22} style={{color:'#2ECC71'}} />
          : <TrendingDown size={22} style={{color:'#E74C3C'}} />}
        <div>
          <div style={{fontWeight:700, fontSize:'1.1rem', color: growth >= 0 ? '#2ECC71' : '#E74C3C'}}>
            {growth >= 0 ? '+' : ''}{growth}%
          </div>
          <div style={{color:'var(--mist)', fontSize:'.8rem'}}>Lead volume vs. last month</div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="admin-stat-cards">
        {stats.map(({ icon:Icon, color, label, val }) => (
          <div key={label} className="admin-stat-card">
            <div style={{marginBottom:12}}><Icon size={22} style={{color, margin:'0 auto'}} /></div>
            <div className="val" style={{color}}>{val}</div>
            <div className="lbl">{label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24}}>
        {/* Lead trend chart — real last-7-days data from /api/leads/dashboard */}
        <div className="admin-card">
          <h3 className="h5" style={{marginBottom:20}}>Weekly Lead Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,162,75,.10)" />
              <XAxis dataKey="label" tick={{fill:'#8B9BAD', fontSize:11}} />
              <YAxis tick={{fill:'#8B9BAD', fontSize:11}} allowDecimals={false} />
              <Tooltip contentStyle={{background:'rgba(7,14,26,.95)', border:'1px solid rgba(201,162,75,.3)', borderRadius:8}} />
              <Bar dataKey="leads" fill="#C9A24B" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Property mix by status */}
        <div className="admin-card">
          <h3 className="h5" style={{marginBottom:20}}>Property Mix by Status</h3>
          {statusMix.length === 0 ? (
            <p style={{color:'var(--mist)', textAlign:'center', padding:'60px 0'}}>No properties yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {statusMix.map(entry => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#8A7A5A'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{background:'rgba(7,14,26,.95)', border:'1px solid rgba(201,162,75,.3)', borderRadius:8}} />
                <Legend wrapperStyle={{fontSize:'.78rem'}} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent leads */}
      <div className="admin-card" style={{marginTop:24}}>
        <div className="flex-between mb-16">
          <h3 className="h5">Recent Leads</h3>
          <Link to="/admin/leads" style={{color:'var(--gold)', fontSize:'.83rem'}}>View All →</Link>
        </div>
        {recent.length === 0
          ? <p style={{color:'var(--mist)', textAlign:'center', padding:'32px 0'}}>No leads yet.</p>
          : recent.map(lead => (
              <div key={lead.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid rgba(201,162,75,.10)'}}>
                <div>
                  <div style={{fontWeight:600, fontSize:'.9rem'}}>{lead.full_name}</div>
                  <div style={{color:'var(--mist)', fontSize:'.78rem'}}>{lead.city} · {lead.property_type}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <span className={`badge ${lead.status==='New' ? 'badge-gold' : lead.status==='Contacted' ? 'badge-blue' : 'badge-green'}`}>{lead.status}</span>
                  <div style={{color:'var(--mist)', fontSize:'.7rem', marginTop:4}}>{new Date(lead.created_at).toLocaleDateString('en-IN')}</div>
                </div>
              </div>
            ))
        }
      </div>

      {/* Follow-ups widget */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:24, marginTop:24}}>
        <FollowupColumn title="Today's Follow-Ups" icon={CalendarClock} color="#3498DB" items={followups?.today} />
        <FollowupColumn title="Tomorrow's Follow-Ups" icon={CalendarClock} color="#C9A24B" items={followups?.tomorrow} />
        <FollowupColumn title="Missed Follow-Ups" icon={AlertTriangle} color="#E74C3C" items={followups?.missed} />
      </div>

      {/* Quick actions */}
      <div className="admin-card" style={{marginTop:24}}>
        <h3 className="h5" style={{marginBottom:16}}>Quick Actions</h3>
        <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
          {[
            ['/admin/properties/new', 'Add Property'],
            ['/admin/leads',          'View Leads'],
            ['/admin/inquiries',      'View Inquiries'],
            ['/admin/builders',       'Manage Builders'],
            ['/admin/engineers',      'Manage Engineers'],
          ].map(([to, label]) => (
            <Link key={to} to={to} className="btn btn-outline btn-sm">{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
