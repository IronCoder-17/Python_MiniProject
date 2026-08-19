// pages/HomePage.js — Full homepage with all major sections
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import {
  Shield, ArrowRight,
  Star, Clock, CheckCircle,
} from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import PropertySearchCard from '../components/PropertySearchCard';
import LeadForm from '../components/LeadForm';
import { propertiesAPI } from '../services/api';


/* ── Section: Hero ──────────────────────────────────────────── */
function Hero() {
  return (
    <section className="hero">
      <video
  className="hero-video"
  src="/images/experts/Video.mp4"
  autoPlay
  loop
  muted
  playsInline
/>
<div className="hero-video-overlay" />
      <div className="container">
        <div className="hero-content fade-in-up">
          <div className="hero-tag">
            <Star size={12} /> India's Premier Luxury Real Estate Platform
          </div>
          <h1 className="display-1 hero-title">
            Where Capital<br />
            <span className="text-gold">Meets Opportunity</span>
          </h1>
          <p className="hero-sub">
            Discover India's finest homes, villas, and commercial assets across Ahmedabad, Mumbai, Bangalore, and beyond — curated for discerning buyers and investors.
          </p>
          <div className="flex gap-16" style={{flexWrap:'wrap'}}>
            <Link to="/properties" className="btn btn-gold btn-lg">
              Explore Properties <ArrowRight size={18} />
            </Link>
            <Link to="/calculator" className="btn btn-ghost btn-lg">
              Calculate Returns
            </Link>
          </div>
          <div className="hero-stat-row" style={{flexWrap:'wrap', gap:32}}>
            {[['5000+','Properties Listed'],['₹5000 Cr+','Transactions'],['20+','Years Experience'],['150+','Top Builders']].map(([v,l]) => (
              <div key={l}>
                <div className="hero-stat-val">{v}</div>
                <div className="hero-stat-lbl">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 3 }}>
        <PropertySearchCard />
      </div>
    </section>
  );
}

/* ── Section: Featured Properties ───────────────────────────── */
function FeaturedProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propertiesAPI.featured().then(r => setProperties(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <section className="section section-light">
      <div className="container">
        <div className="section-header">
          <div className="eyebrow">Premium Portfolio</div>
          <h2 className="display-2 title">Featured Properties</h2>
          <div className="gold-divider-center gold-divider" />
          <p className="subtitle">Handpicked listings across India's most coveted micro-markets, from luxury villas to iconic penthouses.</p>
        </div>

        {loading ? (
          <div className="grid-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="property-card skeleton-card" key={i}>
                <div className="skeleton-block" style={{ height: 220 }} />
                <div style={{ padding: 20 }}>
                  <div className="skeleton-block" style={{ height: 18, width: '70%', marginBottom: 10 }} />
                  <div className="skeleton-block" style={{ height: 14, width: '45%', marginBottom: 18 }} />
                  <div className="skeleton-block" style={{ height: 14, width: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid-3">
            {properties.slice(0, 6).map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}

        <div className="text-center mt-48">
          <Link to="/properties" className="btn btn-outline btn-lg">
            View All Properties <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Section: Ownership Journey ──────────────────────────────── */
const JOURNEY_STEPS = [
  { n:1, title:'Property Discovery', desc:'Explore curated listings matched to your lifestyle and investment goals.', icon:'🔍' },
  { n:2, title:'Site Visit',         desc:'Walk the property with a dedicated relationship manager.', icon:'🏠' },
  { n:3, title:'Documentation',      desc:'Title verification, RERA checks and agreement drafting.', icon:'📄' },
  { n:4, title:'Loan Processing',    desc:'Bank tie-ups help structure financing and disbursement.', icon:'🏦' },
  { n:5, title:'Registration',       desc:'Stamp duty, registration and handover formalities.', icon:'📋' },
  { n:6, title:'Possession',         desc:'Keys handed over with a full snag-check and orientation.', icon:'🔑' },
  { n:7, title:'Wealth Creation',    desc:'Ongoing portfolio tracking as your asset appreciates.', icon:'📈' },
];

function OwnershipJourneySection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="section section-light" ref={ref}>
      <div className="container">
        <div className="section-header">
          <div className="eyebrow">Step By Step</div>
          <h2 className="display-2 title">Your Ownership Journey</h2>
          <div className="gold-divider-center gold-divider" />
        </div>

        {/* Row layout with zigzag animation */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          overflowX: 'auto',
          gap: 0,
          paddingBottom: 16,
        }}>
          {JOURNEY_STEPS.map((step, i) => {
            const isOdd = step.n % 2 !== 0; // 1,3,5,7 → top; 2,4,6 → bottom

            return (
              <React.Fragment key={step.n}>
                {/* Step card */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: 130,
                    flex: '1 1 130px',
                    opacity: inView ? 1 : 0,
                    transform: inView
                      ? 'none'
                      : isOdd
                        ? 'translateY(-40px)'   // odd: slide in from top
                        : 'translateY(40px)',   // even: slide in from bottom
                    transition: `opacity .6s ease ${i * 0.12}s, transform .6s ease ${i * 0.12}s`,
                    // Odd steps go above the center line, even go below
                    marginTop:    isOdd ? 0   : 100,
                    marginBottom: isOdd ? 100 : 0,
                  }}
                >
                  {/* Icon + Title above number for odd; number first for even */}
                  {isOdd && (
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: '1.6rem' }}>{step.icon}</span>
                      <h4 style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-main)', marginTop: 6, marginBottom: 4 }}>
                        {step.title}
                      </h4>
                      <p style={{ fontSize: '.72rem', color: 'var(--text-sub)', lineHeight: 1.5, maxWidth: 110 }}>
                        {step.desc}
                      </p>
                    </div>
                  )}

                  {/* Number circle */}
                  <div className="journey-step-num" style={{ flexShrink: 0 }}>{step.n}</div>

                  {/* Icon + Title below number for even */}
                  {!isOdd && (
                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <span style={{ fontSize: '1.6rem' }}>{step.icon}</span>
                      <h4 style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-main)', marginTop: 6, marginBottom: 4 }}>
                        {step.title}
                      </h4>
                      <p style={{ fontSize: '.72rem', color: 'var(--text-sub)', lineHeight: 1.5, maxWidth: 110 }}>
                        {step.desc}
                      </p>
                    </div>
                  )}
                </div>

                {/* Connector line between steps */}
                {i < JOURNEY_STEPS.length - 1 && (
                  <div style={{
                    height: 2,
                    flex: '0 0 24px',
                    background: 'linear-gradient(to right, rgba(201,162,75,.6), rgba(201,162,75,.2))',
                    alignSelf: 'flex-start',
                    // Center the line on the number circles
                    marginTop: 160,
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Section: Iconic Addresses ───────────────────────────────── */
const ADDRESSES = [
  { city:'Ahmedabad', locality:'Sindhu Bhavan Road', blurb:"Ahmedabad's premier lifestyle boulevard.", psf:'₹9,800/sqft', img: '/images/experts/sindhu-bhavan.jpg' },
  { city:'Ahmedabad', locality:'Ambli',              blurb:'Gated luxury villas near the riverfront.',        psf:'₹8,600/sqft',  img: '/images/experts/ambli.jpg' },
  { city:'Mumbai',    locality:'Bandra West',        blurb:'Iconic sea-facing lanes with old-money glamour.', psf:'₹62,000/sqft', img: '/images/experts/bandra-west.jpg' },
  { city:'Mumbai',    locality:'Worli',              blurb:"Mumbai's skyline luxury address.",                psf:'₹58,000/sqft', img: '/images/experts/worli.jpg' },
  { city:'Bangalore', locality:'Whitefield',         blurb:'Tech-corridor premium with consistent returns.',  psf:'₹9,200/sqft',  img: '/images/experts/whitefield.jpg' },
  { city:'Delhi NCR', locality:'Golf Course Road',   blurb:"Gurugram's flagship high-rise address.",         psf:'₹16,500/sqft', img: '/images/experts/golf-course-road.jpg' },
];

function IconicAddressesSection() {
  return (
    <section className="section bg-cream">
      <div className="container">
        <div className="section-header">
          <div className="eyebrow">Premium Micro-Markets</div>
          <h2 className="display-2 title">Iconic Addresses</h2>
          <div className="gold-divider-center gold-divider" />
        </div>
        <div className="grid-3">
          {ADDRESSES.map(addr => (
            <Link to={`/properties?city=${addr.city}&search=${addr.locality}`} key={addr.locality}>
              <div style={{
                borderRadius:'var(--radius-lg)', overflow:'hidden', position:'relative',
                height:280, cursor:'pointer', background:'var(--ivory)',
                backgroundImage:`url(${addr.img})`,
                backgroundSize:'cover', backgroundPosition:'center',
                transition:'transform .3s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
              >
                <div style={{position:'absolute',inset:0, background:'linear-gradient(to top, rgba(26,18,9,.82) 0%, rgba(26,18,9,.2) 100%)'}} />
                <div style={{position:'absolute',bottom:0,left:0,right:0,padding:24}}>
                  <span className="badge badge-mist" style={{marginBottom:8, display:'inline-block', color:'#000000'}}>{addr.city}</span>
                  <h4 className="h4" style={{marginBottom:4, color:'var(--gold)'}}>{addr.locality}</h4>
                  <p style={{color:'var(--mist)',fontSize:'.83rem',marginBottom:8}}>{addr.blurb}</p>
                  <span style={{color:'var(--gold)',fontSize:'.82rem',fontWeight:600}}>{addr.psf}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section: By The Numbers ─────────────────────────────────── */
const STATS = [
  { val:5000, suffix:'+', label:'Properties Listed' },
  { val:2500, suffix:'+', label:'Happy Buyers' },
  { val:150,  suffix:'+', label:'Builders' },
  { val:350,  suffix:'+', label:'Experts' },
];

function StatCounter({ val, suffix, label }) {
  const { ref, inView } = useInView({ triggerOnce:true });
  return (
    <div className="stat-card" ref={ref}>
      <div className="stat-value">
        {inView ? <CountUp end={val} duration={2.5} separator="," /> : 0}{suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function ByTheNumbersSection() {
  return (
    <section className="section section-light">
      <div className="container">
        <div className="section-header">
          <div className="eyebrow">Our Track Record</div>
          <h2 className="display-2 title">By The Numbers</h2>
          <div className="gold-divider-center gold-divider" />
          <p className="subtitle">Trusted by thousands of buyers, investors, and NRIs across India.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', border:'1px solid rgba(201,162,75,.12)', borderRadius:'var(--radius-lg)', overflow:'hidden'}}>
          {STATS.map(s => <StatCounter key={s.label} {...s} />)}
        </div>
        <div style={{marginTop:48, padding:'40px', background:'rgba(201,162,75,.05)', border:'1px solid rgba(201,162,75,.15)', borderRadius:'var(--radius-lg)', textAlign:'center'}}>
          <div style={{fontFamily:'var(--ff-display)', fontSize:'2rem', color:'var(--gold)', marginBottom:8}}>₹5000+ Crore</div>
          <div style={{color:'var(--mist)', letterSpacing:'.1em', textTransform:'uppercase', fontSize:'.85rem'}}>Total Transactions Facilitated · 20+ Years Industry Experience</div>
        </div>
      </div>
    </section>
  );
}

/* ── Section: Testimonials ───────────────────────────────────── */
const QUOTES = [
  { q:'Real estate cannot be lost or stolen. Purchased wisely, it remains the safest investment.', author:'Warren Buffett-inspired wisdom', title:'Value Investing' },
  { q:'Owning a home is a cornerstone of wealth — both financial affluence and emotional security.', author:'Financial Planning Principle', title:'Wealth Strategy' },
  { q:'The best investment on Earth is Earth.', author:'Louis Glickman', title:'Real Estate Mogul' },
];

function TestimonialsSection() {
  return (
    <section className="section bg-cream">
      <div className="container">
        <div className="section-header">
          <div className="eyebrow">Words of Wisdom</div>
          <h2 className="display-2 title">Timeless Truths</h2>
          <div className="gold-divider-center gold-divider" />
        </div>
        <div className="grid-3">
          {QUOTES.map(({ q, author, title }) => (
            <div key={author} className="testimonial-card glass-card">
              <div className="quote-mark">"</div>
              <p style={{fontFamily:'var(--ff-display)',fontSize:'1.1rem',lineHeight:1.7,fontStyle:'italic',marginBottom:24,position:'relative',zIndex:1}}>"{q}"</p>
              <div>
                <div style={{fontWeight:600, color:'var(--gold)'}}>{author}</div>
                <div style={{color:'var(--mist)',fontSize:'.83rem'}}>{title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section: Lead Gen ───────────────────────────────────────── */
function ContactSection() {
  return (
    <section className="section section-light">
      <div className="container">
        <div className="grid-2" style={{gap:64, alignItems:'center'}}>
          <div>
            <div className="eyebrow" style={{color:'var(--gold)',letterSpacing:'.15em',textTransform:'uppercase',fontSize:'.75rem',marginBottom:12}}>Start Today</div>
            <h2 className="display-2" style={{marginBottom:20}}>Find Your Dream Property</h2>
            <div className="gold-divider" />
            <p className="body-lg" style={{color:'var(--mist)',marginTop:20,marginBottom:32}}>
              Share your requirements and our expert advisors will connect you with properties matched to your vision, budget, and timeline.
            </p>
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              {[
                [CheckCircle, 'No spam — we respect your privacy'],
                [Clock,       'Response within 24 hours'],
                [Shield,      'RERA-verified properties only'],
              ].map(([Icon, text]) => (
                <div key={text} className="flex gap-12" style={{alignItems:'center'}}>
                  <Icon size={18} style={{color:'var(--gold)',flexShrink:0}} />
                  <span style={{color:'var(--mist)'}}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card" style={{padding:40}}>
            <h3 className="h4" style={{marginBottom:24}}>Get Expert Advice</h3>
            <LeadForm sourcePage="homepage" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Main Export ─────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProperties />
      <OwnershipJourneySection />
      <IconicAddressesSection />
      <ByTheNumbersSection />
      <TestimonialsSection />
      <ContactSection />
    </>
  );
}
