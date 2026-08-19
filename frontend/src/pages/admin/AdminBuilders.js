// pages/admin/AdminBuilders.js
import React from 'react';
import AdminCRUD from './AdminCRUD';
import { buildersAPI } from '../../services/api';

const FIELDS = [
  { key:'name',              label:'Name *' },
  { key:'logo_url',          label:'Logo URL',         showInTable:true },
  { key:'years_experience',  label:'Years Experience', type:'number' },
  { key:'total_projects',    label:'Total Projects',   type:'number' },
  { key:'cities_served',     label:'Cities Served (comma-sep)' },
  { key:'rera_registration', label:'RERA Registration' },
  { key:'website',           label:'Website URL',      type:'url' },
  { key:'description',       label:'Description',      type:'textarea', fullWidth:true },
];
const BLANK = { name:'', logo_url:'', years_experience:'', total_projects:'', cities_served:'', rera_registration:'', website:'', description:'' };

export default function AdminBuilders() {
  return (
    <AdminCRUD
      title="Builders"
      fetchFn={buildersAPI.list}
      createFn={buildersAPI.create}
      updateFn={buildersAPI.update}
      deleteFn={buildersAPI.delete}
      fields={FIELDS}
      blankForm={BLANK}
    />
  );
}
