// components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background:'var(--obsidian)', borderTop:'1px solid rgba(201,162,75,.12)', padding:'64px 0 32px' }}>
      <div className="container">
        <div className="grid-4 mb-48" style={{gap:40}}>
          {/* Brand */}
          <div>
            <div className="nav-logo" style={{fontSize:'1.5rem', marginBottom:16}}>
              Iconic<span style={{color:'rgba(255,255,255,.85)'}}>Estates</span>
            </div>
            <p style={{color:'var(--mist)', fontSize:'.9rem', lineHeight:1.8, marginBottom:24}}>
              India's premium real estate platform — where capital meets opportunity across the country's most coveted addresses.
            </p>
            <div className="gold-divider" />
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="h5 text-gold" style={{marginBottom:20}}>Explore</h5>
            {[
              ['/', 'Home'],
              ['/properties', 'Properties'],
              ['/properties?category=Luxury', 'Luxury Homes'],
              ['/properties?category=Commercial', 'Commercial'],
              ['/market', 'Market Intelligence'],
              ['/calculator', 'ROI Calculator'],
            ].map(([to, label]) => (
              <Link key={to} to={to} style={{display:'block', color:'var(--mist)', marginBottom:10, fontSize:'.9rem', transition:'color .2s'}}
                onMouseEnter={e => e.target.style.color='var(--gold)'} onMouseLeave={e => e.target.style.color='var(--mist)'}>
                {label}
              </Link>
            ))}
          </div>

          {/* Experts */}
          <div>
            <h5 className="h5 text-gold" style={{marginBottom:20}}>Our Experts</h5>
            {[
              ['/experts', 'Civil Engineers'],
              ['/experts', 'Interior Designers'],
              ['/experts', 'Exterior Designers'],
              ['/experts', 'Top Builders'],
              ['/contact', 'Become a Partner'],
            ].map(([to, label]) => (
              <Link key={label} to={to} style={{display:'block', color:'var(--mist)', marginBottom:10, fontSize:'.9rem', transition:'color .2s'}}
                onMouseEnter={e => e.target.style.color='var(--gold)'} onMouseLeave={e => e.target.style.color='var(--mist)'}>
                {label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h5 className="h5 text-gold" style={{marginBottom:20}}>Contact</h5>
            {[
              [MapPin, 'Sindhu Bhavan Road, Bodakdev, Ahmedabad – 380054'],
              [Phone,  '+91 98765 43210'],
              [Mail,   'hello@iconicestates.in'],
            ].map(([Icon, text]) => (
              <div key={text} style={{display:'flex', gap:10, marginBottom:16, color:'var(--mist)', fontSize:'.875rem'}}>
                <Icon size={16} style={{color:'var(--gold)', flexShrink:0, marginTop:2}} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cities row */}
        <div style={{borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:32, marginBottom:32}}>
          <p style={{color:'var(--mist)', fontSize:'.78rem', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:16}}>Properties Available In</p>
          <div className="flex gap-16" style={{flexWrap:'wrap'}}>
            {['Ahmedabad','Gandhinagar','Surat','Vadodara','Rajkot','Mumbai','Pune','Bangalore','Hyderabad','Delhi NCR'].map(city => (
              <Link key={city} to={`/properties?city=${city}`} style={{color:'var(--mist)', fontSize:'.82rem'}}
                onMouseEnter={e => e.target.style.color='var(--gold)'} onMouseLeave={e => e.target.style.color='var(--mist)'}>
                {city}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex-between" style={{borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:24, flexWrap:'wrap', gap:16}}>
          <p style={{color:'var(--mist)', fontSize:'.8rem'}}>
            © {new Date().getFullYear()} Iconic Estates India. All rights reserved. RERA compliant.
          </p>
          <p style={{color:'var(--mist)', fontSize:'.8rem', fontStyle:'italic'}}>
            "Where Capital Meets Opportunity"
          </p>
        </div>
      </div>
    </footer>
  );
}
