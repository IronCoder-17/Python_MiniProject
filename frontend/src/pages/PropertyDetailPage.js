// pages/PropertyDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Maximize2, Bed, Bath, Car, Shield, Star, Phone, CheckCircle, Heart, Share2, MessageCircle, Download, PlayCircle, Compass } from 'lucide-react';
import { propertiesAPI, inquiriesAPI } from '../services/api';
import { isWishlisted, toggleWishlist } from '../services/wishlist';
import { trackView } from '../services/recentlyViewed';
import { whatsappLink } from '../config/company';
import RecentlyViewedSection from '../components/RecentlyViewedSection';
import EmiCalculator from '../components/EmiCalculator';
import toast from 'react-hot-toast';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [form,   setForm]   = useState({ full_name:'', mobile_number:'', email:'', inquiry_type:'Contact Owner', preferred_date:'', message:'' });
  const [sending, setSending] = useState(false);
  const [wished, setWished] = useState(false);

  useEffect(() => {
    propertiesAPI.get(id).then(r => {
      setProperty(r.data);
      setLoading(false);
      trackView(id);
    }).catch(() => setLoading(false));
    setWished(isWishlisted(Number(id)));
  }, [id]);

  const handleWishlist = () => setWished(toggleWishlist(Number(id)));

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: property?.title, url }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const submitInquiry = async () => {
    if (!form.full_name || !form.mobile_number) { toast.error('Name and mobile required'); return; }
    setSending(true);
    try {
      await inquiriesAPI.create({ ...form, property_id: id });
      toast.success('Inquiry submitted! We\'ll contact you shortly.');
      setForm(f => ({ ...f, full_name:'', mobile_number:'', email:'', message:'' }));
    } catch { toast.error('Failed to submit. Please try again.'); }
    finally { setSending(false); }
  };

  if (loading) return <div className="loading-center" style={{minHeight:'100vh'}}><div className="spinner" /></div>;
  if (!property) return (
    <div style={{paddingTop:120, textAlign:'center'}}>
      <h2>Property not found</h2>
      <Link to="/properties" className="btn btn-gold mt-24">Back to Properties</Link>
    </div>
  );

  const allImages = property.images?.length > 0
    ? property.images.map(i => i.image_url)
    : [property.hero_image || `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80`];

  const amenityList = property.amenities?.split(',').map(a => a.trim()).filter(Boolean) || [];

  return (
    <div style={{paddingTop:72, background:'var(--ivory)', minHeight:'100vh'}}>
      {/* Breadcrumb */}
      <div style={{background:'var(--white)', borderBottom:'1px solid rgba(201,162,75,.15)', padding:'16px 0'}}>
        <div className="container flex gap-8" style={{alignItems:'center', fontSize:'.85rem', color:'var(--mist)'}}>
          <Link to="/" style={{color:'var(--mist)'}}>Home</Link> /
          <Link to="/properties" style={{color:'var(--mist)'}}>Properties</Link> /
          <span style={{color:'var(--gold)'}}>{property.title}</span>
        </div>
      </div>

      <div className="container" style={{padding:'40px 24px'}}>
        {(property.is_sold || property.is_rented) && (
          <div style={{
            background: 'rgba(231,76,60,.08)', border: '1px solid rgba(231,76,60,.3)',
            borderRadius: 'var(--radius)', padding: '14px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 10, color: '#c0392b', fontWeight: 600,
          }}>
            <Shield size={18} />
            This property has been marked as {property.is_sold ? 'Sold' : 'Rented'} and is no longer available.
          </div>
        )}
        <div style={{display:'grid', gridTemplateColumns:'1fr 380px', gap:40, alignItems:'start'}}>

          {/* LEFT: Main content */}
          <div>
            {/* Gallery */}
            <div style={{borderRadius:'var(--radius-lg)', overflow:'hidden', marginBottom:24, background:'var(--cream)'}}>
              <img
                src={allImages[activeImg]}
                alt={property.title}
                style={{width:'100%', height:480, objectFit:'cover'}}
              />
            </div>
            {allImages.length > 1 && (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginBottom: '32px'
    }}
  >
    {allImages.map((img, i) => (
      <img
        key={i}
        src={img}
        alt=""
        onClick={() => setActiveImg(i)}
        style={{
          width: '100%',
          height: 180,
          objectFit: 'cover',
          borderRadius: 12,
          cursor: 'pointer',
          border:
            i === activeImg
              ? '3px solid var(--gold)'
              : '2px solid rgba(201,162,75,.15)',
          opacity: i === activeImg ? 1 : 0.85,
          transition: 'all .3s ease'
        }}
      />
    ))}
  </div>
)}

            {/* Title row */}
            <div className="flex-between mb-24" style={{flexWrap:'wrap', gap:16}}>
              <div>
                <div className="flex gap-8 mb-8" style={{alignItems:'center'}}>
                  <span className="badge badge-gold">{property.category}</span>
                  <span className="badge badge-mist">{property.property_type}</span>
                  <span className={`badge ${property.possession_status==='Ready To Move' ? 'badge-green' : property.possession_status==='New Launch' ? 'badge-gold' : 'badge-blue'}`}>
                    {property.possession_status}
                  </span>
                </div>
                <h1 className="display-3" style={{marginBottom:8}}>{property.title}</h1>
                <div className="flex gap-6" style={{alignItems:'center', color:'var(--mist)'}}>
                  <MapPin size={15} style={{color:'var(--gold)'}} />
                  {property.location_area}, {property.city}, {property.state}
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div className="flex gap-8" style={{justifyContent:'flex-end', marginBottom:10}}>
                  <button
                    type="button"
                    className={`fav-btn detail-action-btn ${wished ? 'active' : ''}`}
                    onClick={handleWishlist}
                    aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
                    title={wished ? 'Saved' : 'Save property'}
                  >
                    <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    className="fav-btn detail-action-btn"
                    onClick={handleShare}
                    aria-label="Share this property"
                    title="Share"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
                <div className="property-price" style={{fontSize:'2rem'}}>{property.price_label}</div>
                <div style={{color:'var(--mist)', fontSize:'.85rem'}}>
                  ₹{Math.round(property.price / property.area_sqft).toLocaleString()}/sq.ft.
                </div>
              </div>
            </div>

            {/* Key specs */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))', gap:16, marginBottom:40,
              background:'rgba(255,255,255,.03)', border:'1px solid rgba(201,162,75,.12)', borderRadius:'var(--radius-lg)', padding:24}}>
              {[
                [Maximize2, `${property.area_sqft?.toLocaleString()} Sq.Ft.`, 'Area'],
                property.bedrooms > 0 && [Bed, `${property.bedrooms} BHK`, 'Bedrooms'],
                property.bathrooms > 0 && [Bath, `${property.bathrooms}`, 'Bathrooms'],
                property.parking > 0 && [Car, `${property.parking}`, 'Parking'],
                [Shield, property.rera_number || 'RERA Registered', 'RERA'],
                [Star, '⭐'.repeat(property.luxury_rating || 3), 'Luxury Rating'],
              ].filter(Boolean).map(([Icon, val, lbl]) => (
                <div key={lbl} style={{textAlign:'center'}}>
                  <div style={{color:'var(--gold)', marginBottom:6}}><Icon size={20} style={{margin:'0 auto'}} /></div>
                  <div style={{fontWeight:600, fontSize:'.95rem', marginBottom:2}}>{val}</div>
                  <div style={{color:'var(--mist)', fontSize:'.75rem', textTransform:'uppercase', letterSpacing:'.06em'}}>{lbl}</div>
                </div>
              ))}
            </div>

            {/* Video tour */}
            {property.video_url && (
              <div style={{marginBottom:40}}>
                <h3 className="h4" style={{marginBottom:16}}><PlayCircle size={18} style={{verticalAlign:-3, marginRight:6, color:'var(--gold)'}} />Video Tour</h3>
                <div style={{borderRadius:'var(--radius-lg)', overflow:'hidden', background:'#000', aspectRatio:'16/9'}}>
                  <video src={property.video_url} controls style={{width:'100%', height:'100%', display:'block'}} />
                </div>
              </div>
            )}

            {/* 360° virtual tour */}
            {property.virtual_tour_url && (
              <div style={{marginBottom:40}}>
                <h3 className="h4" style={{marginBottom:16}}><Compass size={18} style={{verticalAlign:-3, marginRight:6, color:'var(--gold)'}} />360° Virtual Tour</h3>
                <div style={{borderRadius:'var(--radius-lg)', overflow:'hidden', aspectRatio:'16/9'}}>
                  <iframe
                    src={property.virtual_tour_url}
                    title="360 Virtual Tour"
                    allow="vr; gyroscope; accelerometer"
                    style={{width:'100%', height:'100%', border:'none', display:'block'}}
                  />
                </div>
              </div>
            )}

            {/* Description */}
            {property.description && (
              <div style={{marginBottom:40}}>
                <h3 className="h4" style={{marginBottom:16}}>About This Property</h3>
                <p style={{color:'var(--mist)', lineHeight:1.8}}>{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {amenityList.length > 0 && (
              <div style={{marginBottom:40}}>
                <h3 className="h4" style={{marginBottom:16}}>Amenities</h3>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:12}}>
                  {amenityList.map(a => (
                    <div key={a} className="flex gap-8" style={{alignItems:'center', color:'var(--mist)'}}>
                      <CheckCircle size={16} style={{color:'var(--gold)', flexShrink:0}} />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Builder info */}
            {property.builder_name && (
              <div style={{background:'rgba(255,255,255,.03)', border:'1px solid rgba(201,162,75,.12)', borderRadius:'var(--radius-lg)', padding:28, marginBottom:40}}>
                <h3 className="h4" style={{marginBottom:16}}>Developer Information</h3>
                <div className="flex gap-16" style={{alignItems:'center', marginBottom:16, flexWrap:'wrap'}}>
                  {property.builder_logo && (
                    <img src={property.builder_logo} alt={property.builder_name}
                      style={{height:48, objectFit:'contain', background:'rgba(255,255,255,.05)', borderRadius:8, padding:8}} />
                  )}
                  <div>
                    <h4 style={{marginBottom:4}}>{property.builder_name}</h4>
                    {property.rera_registration && <div style={{color:'var(--mist)', fontSize:'.83rem'}}>RERA: {property.rera_registration}</div>}
                  </div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16}}>
                  {property.years_experience && <div><div style={{color:'var(--gold)', fontWeight:700}}>{property.years_experience}+ Yrs</div><div style={{color:'var(--mist)', fontSize:'.8rem'}}>Experience</div></div>}
                  {property.total_projects   && <div><div style={{color:'var(--gold)', fontWeight:700}}>{property.total_projects}+</div><div style={{color:'var(--mist)', fontSize:'.8rem'}}>Projects</div></div>}
                  {property.cities_served    && <div><div style={{color:'var(--gold)', fontWeight:700, fontSize:'.85rem'}}>{property.cities_served}</div><div style={{color:'var(--mist)', fontSize:'.8rem'}}>Cities</div></div>}
                </div>
              </div>
            )}

            {/* Floor plans */}
            {property.floor_plans?.length > 0 && (
              <div style={{marginBottom:40}}>
                <h3 className="h4" style={{marginBottom:16}}>Floor Plans</h3>
                <div className="flex gap-16" style={{flexWrap:'wrap'}}>
                  {property.floor_plans.map(plan => (
                    <div key={plan.id} style={{border:'1px solid rgba(201,162,75,.15)', borderRadius:'var(--radius)', padding:16, textAlign:'center'}}>
                      <img src={plan.image_url} alt={plan.plan_name} style={{width:200, height:140, objectFit:'contain'}} />
                      <div style={{color:'var(--mist)', fontSize:'.83rem', marginTop:8}}>{plan.plan_name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Contact sticky sidebar */}
          <div style={{position:'sticky', top:92}}>
            <div className="glass-card" style={{padding:28, marginBottom:20}}>
              <h3 className="h4" style={{marginBottom:6}}>Enquire About This Property</h3>
              <p style={{color:'var(--mist)', fontSize:'.85rem', marginBottom:24}}>Our expert will get back within 24 hours.</p>

              <div style={{display:'flex', flexDirection:'column', gap:14}}>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.inquiry_type} onChange={e => setForm(f => ({...f, inquiry_type: e.target.value}))}>
                    <option>Contact Owner</option>
                    <option>Schedule Site Visit</option>
                    <option>Request Callback</option>
                  </select>
                </div>
                {form.inquiry_type === 'Schedule Site Visit' && (
                  <div className="form-group">
                    <label className="form-label">Preferred Date</label>
                    <input className="form-input" type="date" value={form.preferred_date} onChange={e => setForm(f=>({...f, preferred_date:e.target.value}))} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="Your name" value={form.full_name} onChange={e => setForm(f=>({...f, full_name:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile *</label>
                  <input className="form-input" placeholder="+91 98765 43210" value={form.mobile_number} onChange={e => setForm(f=>({...f, mobile_number:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f=>({...f, email:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-textarea" style={{minHeight:80}} placeholder="I'm interested in this property…" value={form.message} onChange={e => setForm(f=>({...f, message:e.target.value}))} />
                </div>
                <button className="btn btn-gold btn-full" onClick={submitInquiry} disabled={sending}>
                  {sending ? 'Sending…' : <><Phone size={15} /> Send Enquiry</>}
                </button>
                <a
                  href={whatsappLink(`Hi, I'm interested in "${property.title}" (${property.price_label}) in ${property.city}. Could you share more details?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-full whatsapp-btn"
                >
                  <MessageCircle size={16} /> Enquire on WhatsApp
                </a>
                {property.brochure_url && (
                  <a
                    href={property.brochure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-full"
                    style={{marginTop:10}}
                  >
                    <Download size={15} /> Download Brochure
                  </a>
                )}
              </div>
            </div>

            {/* RERA info */}
            {property.rera_number && (
              <div style={{background:'rgba(46,204,113,.05)', border:'1px solid rgba(46,204,113,.2)', borderRadius:'var(--radius)', padding:16, fontSize:'.83rem', color:'var(--mist)'}}>
                <div className="flex gap-8" style={{alignItems:'center', marginBottom:8}}>
                  <Shield size={15} style={{color:'#2ECC71'}} />
                  <strong style={{color:'#2ECC71'}}>RERA Registered</strong>
                </div>
                <div>RERA No: <strong style={{color:'var(--text-main)'}}>{property.rera_number}</strong></div>
              </div>
            )}

            {/* EMI calculator, pre-filled from this property's price */}
            <div className="glass-card" style={{padding:24, marginTop:20}}>
              <EmiCalculator propertyPrice={property.price} compact />
              <Link to="/calculator" style={{display:'block', textAlign:'center', marginTop:14, fontSize:'.8rem', color:'var(--gold)'}}>
                Model full investment returns →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <RecentlyViewedSection excludeId={id} />
    </div>
  );
}
