// services/api.js — centralised Axios instance + all API calls
import axios from 'axios';

const NODE_API = process.env.REACT_APP_API_URL || '/api';
const PY_API   = process.env.REACT_APP_ANALYTICS_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL: NODE_API });

// Attach JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('iconic_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401 (invalid/missing token) or 403 with an
// expired-token message (the backend uses 403 specifically for
// TokenExpiredError — see middleware/auth.js). Plain 403s that are
// really "insufficient privileges" for a logged-in user are left
// alone so the calling page can show its own message.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err.response?.status;
    const isExpired = status === 403 && /expired/i.test(err.response?.data?.error || '');
    if ((status === 401 || isExpired) && window.location.pathname.startsWith('/admin')) {
      localStorage.removeItem('iconic_token');
      if (!window.location.pathname.endsWith('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  login:          (data) => api.post('/auth/login', data),
  me:             ()     => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ── Properties ───────────────────────────────────────────────
export const propertiesAPI = {
  list:       (params) => api.get('/properties', { params }),
  featured:   ()       => api.get('/properties/featured'),
  get:        (id)     => api.get(`/properties/${id}`),
  filterMeta: ()       => api.get('/properties/filters/meta'),
  create:     (data)   => api.post('/properties', data),
  update:     (id, d)  => api.put(`/properties/${id}`, d),
  delete:     (id)     => api.delete(`/properties/${id}`),
  addImages:  (id, imgs) => api.post(`/properties/${id}/images`, { images: imgs }),
};

// ── Leads ────────────────────────────────────────────────────
export const leadsAPI = {
  create:        (data) => api.post('/leads', data),
  list:          (p)    => api.get('/leads', { params: p }),
  dashboard:     ()     => api.get('/leads/dashboard'),
  export:        ()     => api.get('/leads/export', { responseType: 'blob' }),
  updateStatus:  (id, s) => api.put(`/leads/${id}/status`, { status: s }),
};

// ── Inquiries ─────────────────────────────────────────────────
export const inquiriesAPI = {
  create:       (data) => api.post('/inquiries', data),
  list:         (p)    => api.get('/inquiries', { params: p }),
  updateStatus: (id, s) => api.put(`/inquiries/${id}/status`, { status: s }),
};

// ── CRM (Phase 1: notes, follow-ups, assignment, activity) ────
export const crmAPI = {
  getDetail:      (type, id)        => api.get(`/crm/${type}/${id}`),
  addNote:        (type, id, note)  => api.post(`/crm/${type}/${id}/notes`, { note }),
  deleteNote:     (noteId)          => api.delete(`/crm/notes/${noteId}`),
  addFollowup:    (type, id, data)  => api.post(`/crm/${type}/${id}/followups`, data),
  updateFollowup: (followupId, status) => api.put(`/crm/followups/${followupId}`, { status }),
  followupsDashboard: ()            => api.get('/crm/followups/dashboard'),
  assign:         (type, id, user_id) => api.put(`/crm/${type}/${id}/assign`, { user_id }),
  listExecutives: ()                => api.get('/crm/executives'),
  logContact:     (type, id, channel) => api.post(`/crm/${type}/${id}/contact`, { channel }),
  updateStatus:   (type, id, status) => api.put(`/crm/${type}/${id}/status`, { status }),
  updateScore:    (type, id, lead_score) => api.put(`/crm/${type}/${id}/score`, { lead_score }),

  // Site Visits (Phase 3)
  listVisits:     (type, id)        => api.get(`/crm/${type}/${id}/site-visits`),
  addVisit:       (type, id, data)  => api.post(`/crm/${type}/${id}/site-visits`, data),
  updateVisit:    (visitId, data)   => api.put(`/crm/site-visits/${visitId}`, data),
  deleteVisit:    (visitId)         => api.delete(`/crm/site-visits/${visitId}`),
  visitsToday:    ()                => api.get('/crm/site-visits/today'),

  // Documents (Phase 3)
  listDocuments:  (type, id)        => api.get(`/crm/${type}/${id}/documents`),
  uploadDocument: (type, id, formData) => api.post(`/crm/${type}/${id}/documents`, formData),
  deleteDocument: (docId)           => api.delete(`/crm/documents/${docId}`),

  // Preferences (Phase 3)
  getPreferences: (type, id)        => api.get(`/crm/${type}/${id}/preferences`),
  savePreferences: (type, id, data) => api.put(`/crm/${type}/${id}/preferences`, data),
};

// ── Templates (Phase 2: WhatsApp + Email) ──────────────────────
export const templatesAPI = {
  listWhatsapp:   ()      => api.get('/templates/whatsapp'),
  createWhatsapp: (data)  => api.post('/templates/whatsapp', data),
  updateWhatsapp: (id, d) => api.put(`/templates/whatsapp/${id}`, d),
  deleteWhatsapp: (id)    => api.delete(`/templates/whatsapp/${id}`),

  listEmail:      ()      => api.get('/templates/email'),
  createEmail:    (data)  => api.post('/templates/email', data),
  updateEmail:    (id, d) => api.put(`/templates/email/${id}`, d),
  deleteEmail:    (id)    => api.delete(`/templates/email/${id}`),

  emailStatus:    ()      => api.get('/templates/email-status'),
  sendEmail:      (type, id, data) => api.post(`/templates/send-email/${type}/${id}`, data),
};

// ── Builders ─────────────────────────────────────────────────
export const buildersAPI = {
  list:   ()        => api.get('/builders'),
  get:    (id)      => api.get(`/builders/${id}`),
  create: (data)    => api.post('/builders', data),
  update: (id, d)   => api.put(`/builders/${id}`, d),
  delete: (id)      => api.delete(`/builders/${id}`),
};

// ── Experts ──────────────────────────────────────────────────
export const expertsAPI = {
  listCivil:    ()      => api.get('/experts/civil'),
  listInterior: ()      => api.get('/experts/interior'),
  listExterior: ()      => api.get('/experts/exterior'),
  createCivil:  (d)     => api.post('/experts/civil', d),
  createInterior:(d)    => api.post('/experts/interior', d),
  createExterior:(d)    => api.post('/experts/exterior', d),
  updateCivil:  (id,d)  => api.put(`/experts/civil/${id}`, d),
  deleteCivil:  (id)    => api.delete(`/experts/civil/${id}`),
};

// ── Market ───────────────────────────────────────────────────
export const marketAPI = {
  reports:      ()        => api.get('/market/reports'),
  reportByCity: (city)    => api.get(`/market/reports/${city}`),
  createReport: (data)    => api.post('/market/reports', data),
  updateReport: (id, d)   => api.put(`/market/reports/${id}`, d),
  deleteReport: (id)      => api.delete(`/market/reports/${id}`),
  publicData:   ()        => api.get('/market/public-data'),
  listUsers:    ()        => api.get('/market/users'),
  toggleUser:   (id)      => api.put(`/market/users/${id}/toggle`),
};

// ── Python Analytics ─────────────────────────────────────────
const py = axios.create({ baseURL: PY_API });

export const analyticsAPI = {
  calculateROI:    (data) => py.post('/roi/calculate', data),
  marketOverview:  (cities) => py.get('/market/overview', { params: { cities } }),
  marketTimeSeries:(cities, years) => py.get('/market/timeseries', { params: { cities, years } }),
  compareCities:   (a, b) => py.get('/market/compare', { params: { city_a: a, city_b: b } }),
  recommend:       (data) => py.post('/recommendations/suggest', data),
  journeyCalc:     (data) => py.post('/journey/calculate', data),
};

// ── Notifications ────────────────────────────────────────────
export const notificationsAPI = {
  list:        (params) => api.get('/notifications', { params }),
  markRead:    (id)     => api.put(`/notifications/${id}/read`),
  markAllRead: ()       => api.put('/notifications/read-all'),
};

// ── Utility: Download blob as file ───────────────────────────
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};

export default api;