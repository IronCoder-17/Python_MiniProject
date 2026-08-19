// pages/admin/AdminLayout.js — White & Gold theme
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import {
  LayoutDashboard, Building2, Users, LogOut,
  BarChart2, UserCheck, Hammer, Brush,
  Home, Mail, MessageSquare, Menu, X, FileText,
} from 'lucide-react';

const NAV = [
  { section:'Overview' },
  { to:'/admin/dashboard',   icon:LayoutDashboard, label:'Dashboard' },
  { section:'Properties' },
  { to:'/admin/properties',  icon:Building2,       label:'Properties' },
  { to:'/admin/builders',    icon:Hammer,          label:'Builders' },
  { section:'Experts' },
  { to:'/admin/engineers',   icon:UserCheck,       label:'Civil Engineers' },
  { to:'/admin/interior',    icon:Brush,           label:'Interior Designers' },
  { to:'/admin/exterior',    icon:Home,            label:'Exterior Designers' },
  { section:'Leads & CRM' },
  { to:'/admin/leads',       icon:Mail,            label:'Leads' },
  { to:'/admin/inquiries',   icon:MessageSquare,   label:'Inquiries' },
  { to:'/admin/templates',   icon:FileText,        label:'Templates' },
  { section:'Analytics' },
  { to:'/admin/market',      icon:BarChart2,       label:'Market Reports' },
  { section:'Administration' },
  { to:'/admin/users',       icon:Users,           label:'Users' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <div
        className="admin-sidebar"
        style={{
          ...(sidebarOpen ? { width: 260 } : {}),
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // sidebar itself does NOT scroll
        }}
      >
        {/* Logo */}
        <div className="sidebar-logo" style={{ flexShrink: 0 }}>
          <div style={{
            fontFamily:'var(--ff-display)', fontSize:'1.2rem', fontWeight:700, color:'var(--gold)',
          }}>
            Iconic<span style={{color:'var(--text-main)'}}>Estates</span>
          </div>
          <div style={{color:'var(--mist)', fontSize:'.72rem', marginTop:4, textTransform:'uppercase', letterSpacing:'.08em'}}>
            Admin Portal
          </div>
        </div>

        {/* Nav Items — only this part scrolls */}
        <nav
          className="sidebar-nav"
          style={{ flex: 1, overflowY: 'auto' }}
        >
          {NAV.map((item, i) =>
            item.section ? (
              <div key={`sec-${i}`} className="sidebar-section-label">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={17} />
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        {/* User / Logout — always pinned at bottom */}
        <div style={{
          padding: '20px 16px',
          borderTop: '1px solid rgba(201,162,75,.15)',
          flexShrink: 0,          // never shrink — always visible
          background: 'var(--white)',
        }}>
          <div style={{
            padding:'12px 14px', marginBottom:8,
            background:'rgba(201,162,75,.06)', borderRadius:10,
            border:'1px solid rgba(201,162,75,.15)',
          }}>
            <div style={{fontSize:'.85rem', fontWeight:600, color:'var(--text-main)'}}>{user?.name}</div>
            <div style={{fontSize:'.72rem', color:'var(--mist)', marginTop:2}}>{user?.role} · {user?.email}</div>
          </div>
          <button
            className="sidebar-nav-item"
            onClick={handleLogout}
            style={{ color:'var(--danger)', width:'100%' }}
          >
            <LogOut size={17} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        {/* Mobile header */}
        <div style={{
          display:'flex', alignItems:'center', gap:16, marginBottom:32,
          paddingBottom:20, borderBottom:'1px solid rgba(201,162,75,.15)',
        }}>
          <button
            className="admin-mobile-toggle"
            style={{color:'var(--text-main)', background:'none', border:'none', cursor:'pointer'}}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
          <div style={{flex:1}}>
            <h1 style={{fontFamily:'var(--ff-display)', fontSize:'1.4rem', color:'var(--text-main)'}}>
              Admin Panel
            </h1>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:18}}>
            <NotificationBell />
            <div style={{fontSize:'.83rem', color:'var(--mist)'}}>
              Welcome, {user?.name?.split(' ')[0]}
            </div>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}