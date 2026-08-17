// components/LeadForm.js
import React, { useState } from 'react';
import { leadsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';

const CITIES   = ['Ahmedabad','Gandhinagar','Surat','Vadodara','Rajkot','Mumbai','Pune','Bangalore','Hyderabad','Delhi NCR','Other'];
const BUDGETS  = ['Under ₹50 Lakh','₹50L – ₹1 Cr','₹1 Cr – ₹2 Cr','₹2 Cr – ₹5 Cr','₹5 Cr – ₹10 Cr','₹10 Cr+'];
const PTYPES   = ['Villa','Bungalow','Flat','Apartment','Penthouse','Duplex','Studio','Office','Retail','Warehouse','Farmhouse','Agricultural Land','Luxury Villa'];

export default function LeadForm({ sourcePage, dark = true }) {
  const [form, setForm] = useState({ full_name:'', mobile_number:'', email:'', city:'', budget:'', property_type:'', message:'' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.full_name || !form.mobile_number) {
      toast.error('Name and mobile number are required.');
      return;
    }
    setLoading(true);
    try {
      await leadsAPI.create({ ...form, source_page: sourcePage || 'website' });
      setSent(true);
      toast.success('Thank you! Our team will call you shortly.');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div style={{ textAlign:'center', padding:'48px 24px' }}>
      <div style={{ fontSize:'3rem', marginBottom:16 }}>🏠</div>
      <h3 className="display-3 text-gold" style={{marginBottom:12}}>Thank You!</h3>
      <p className="body-lg" style={{color:'var(--mist)'}}>Our property advisor will contact you within 24 hours.</p>
    </div>
  );

  const cls = dark ? '' : 'form-light';

  return (
    <div className={cls}>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input className="form-input" placeholder="Rajesh Patel" value={form.full_name} onChange={e => set('full_name',e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Mobile Number *</label>
          <input className="form-input" placeholder="+91 98765 43210" value={form.mobile_number} onChange={e => set('mobile_number',e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" placeholder="rajesh@example.com" value={form.email} onChange={e => set('email',e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Preferred City</label>
          <select className="form-select" value={form.city} onChange={e => set('city',e.target.value)}>
            <option value="">Select City</option>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Budget Range</label>
          <select className="form-select" value={form.budget} onChange={e => set('budget',e.target.value)}>
            <option value="">Select Budget</option>
            {BUDGETS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Property Type</label>
          <select className="form-select" value={form.property_type} onChange={e => set('property_type',e.target.value)}>
            <option value="">Select Type</option>
            {PTYPES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group mt-24">
        <label className="form-label">Message</label>
        <textarea className="form-textarea" placeholder="Tell us more about what you're looking for…" value={form.message} onChange={e => set('message',e.target.value)} />
      </div>
      <button className="btn btn-gold btn-lg btn-full mt-24" onClick={submit} disabled={loading}>
        {loading ? 'Sending…' : <><Send size={16} /> Get Expert Advice</>}
      </button>
    </div>
  );
}
