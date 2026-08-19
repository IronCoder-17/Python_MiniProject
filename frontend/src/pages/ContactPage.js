// pages/ContactPage.js
import React from 'react';
import LeadForm from '../components/LeadForm';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <div style={{paddingTop:72, background:'var(--ink)', minHeight:'100vh'}}>
      <div style={{background:'var(--obsidian)', borderBottom:'1px solid rgba(201,162,75,.1)', padding:'48px 0'}}>
        <div className="container text-center">
          <div className="eyebrow" style={{color:'var(--gold)',letterSpacing:'.15em',textTransform:'uppercase',fontSize:'.75rem',marginBottom:12}}>Reach Out</div>
          <h1 className="display-2" style={{marginBottom:16, color: '#D4AF37'}}>Contact Us</h1>
          <p style={{color:'var(--mist)',maxWidth:500,margin:'0 auto'}}>
            Our property advisors are available six days a week to help you find, invest in, or sell the right property.
          </p>
        </div>
      </div>

      <div className="container" style={{padding:'64px 24px'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:64, alignItems:'start'}}>
          {/* Info */}
          <div>
            <h2 className="display-3" style={{marginBottom:24, color: '#D4AF37'}}>Let's Start a Conversation</h2>
            <p style={{color:'var(--mist)', lineHeight:1.8, marginBottom:40}}>
              Whether you're buying your first home, investing in commercial property, or looking to list a premium asset — our experts are here to guide you.
            </p>
            {[
              [MapPin,  'Our Office',      'Sindhu Bhavan Road, Bodakdev\nAhmedabad – 380054, Gujarat'],
              [Phone,   'Call Us',         '+91 98765 43210\n+91 79 4040 5050'],
              [Mail,    'Email Us',        'hello@iconicestates.in\nsupport@iconicestates.in'],
              [Clock,   'Working Hours',   'Monday – Saturday: 9 AM – 7 PM\nSunday: 10 AM – 4 PM'],
            ].map(([Icon, title, text]) => (
              <div key={title} style={{display:'flex', gap:20, marginBottom:32}}>
                <div style={{width:48, height:48, borderRadius:'50%', background:'rgba(201,162,75,.1)', border:'1px solid rgba(201,162,75,.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  <Icon size={20} style={{color:'var(--gold)'}} />
                </div>
                <div>
                  <h5 className="h5" style={{marginBottom:4}}>{title}</h5>
                  <p style={{color:'var(--mist)', lineHeight:1.7, whiteSpace:'pre-line', fontSize:'.9rem'}}>{text}</p>
                </div>
              </div>
            ))}

            <div style={{background:'rgba(201,162,75,.06)', border:'1px solid rgba(201,162,75,.2)', borderRadius:'var(--radius-lg)', padding:24}}>
              <h4 style={{marginBottom:12, color:'var(--gold)'}}>For NRI Inquiries</h4>
              <p style={{color:'var(--mist)', fontSize:'.9rem', lineHeight:1.7}}>
                We have a dedicated NRI desk with advisors fluent in English, Gujarati, Hindi, and Kannada. WhatsApp us at +91 98765 43211 for a call back at your convenient time zone.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="glass-card" style={{padding:40}}>
            <h3 className="h4" style={{marginBottom:8}}>Send an Enquiry</h3>
            <p style={{color:'var(--mist)', fontSize:'.87rem', marginBottom:28}}>We'll respond within 24 hours.</p>
            <LeadForm sourcePage="contact-page" />
          </div>
        </div>
      </div>
    </div>
  );
}
