// components/FloatingContact.js
import React, { useState } from 'react';
import { MessageCircle, Phone, X, PhoneCall } from 'lucide-react';
import { COMPANY, whatsappLink } from '../config/company';

export default function FloatingContact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="floating-contact">
      {open && (
        <div className="floating-contact-menu">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="floating-contact-item whatsapp"
          >
            <MessageCircle size={18} /> WhatsApp Us
          </a>
          <a
            href={`tel:${COMPANY.phoneDial}`}
            className="floating-contact-item call"
          >
            <PhoneCall size={18} /> Call {COMPANY.phone}
          </a>
        </div>
      )}
      <button
        type="button"
        className="floating-contact-toggle"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close contact options' : 'Contact us'}
      >
        {open ? <X size={22} /> : <Phone size={22} />}
      </button>
    </div>
  );
}
