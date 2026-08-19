// pages/admin/AdminUsers.js
import React, { useState, useEffect } from 'react';
import { marketAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    marketAPI.listUsers().then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggle = async (id) => {
    await marketAPI.toggleUser(id);
    toast.success('User status updated');
    load();
  };

  return (
    <div>
      <div className="flex-between mb-32">
        <div>
          <h2 className="display-3" style={{marginBottom:4}}>Users</h2>
          <p style={{color:'var(--mist)'}}>{users.length} admin users</p>
        </div>
      </div>
      <div style={{background:'rgba(201,162,75,.05)', border:'1px solid rgba(201,162,75,.2)', borderRadius:'var(--radius)', padding:16, marginBottom:24, fontSize:'.85rem', color:'var(--mist)'}}>
        ℹ️ New admin users can only be created via the API (POST /api/auth/register) using a super_admin token.
      </div>
      {loading ? <div className="loading-center"><div className="spinner"/></div> : (
        <div className="admin-card" style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Active</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{color:'var(--mist)'}}>{u.id}</td>
                  <td>{u.name}</td>
                  <td style={{color:'var(--mist)'}}>{u.email}</td>
                  <td><span className={`badge ${u.role==='super_admin' ? 'badge-gold' : 'badge-blue'}`}>{u.role}</span></td>
                  <td style={{color:'var(--mist)', fontSize:'.8rem'}}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    <button onClick={() => toggle(u.id)} style={{background:'none', border:'none', cursor:'pointer', color: u.is_active ? '#2ECC71' : '#E74C3C'}}>
                      {u.is_active ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
