// config/company.js
// Single source of truth for contact details used across the site
// (footer, contact page, WhatsApp links, floating contact button).
// Sourced from the numbers already published on Footer.js / ContactPage.js.

export const COMPANY = {
  phone: '+91 98765 43210',
  phoneDial: '+919876543210',
  whatsapp: '+91 98765 43211',
  whatsappDial: '919876543211',
  email: 'hello@iconicestates.in',
};

export function whatsappLink(message) {
  const text = encodeURIComponent(message || "Hi, I'd like to know more about your properties.");
  return `https://wa.me/${COMPANY.whatsappDial}?text=${text}`;
}
