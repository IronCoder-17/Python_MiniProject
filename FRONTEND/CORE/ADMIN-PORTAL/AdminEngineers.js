// pages/admin/AdminEngineers.js
import React from 'react';
import AdminCRUD from './AdminCRUD';
import { expertsAPI } from '../../services/api';

const ENG_FIELDS = [
  { key:'name',              label:'Name *' },
  { key:'photo_url',         label:'Photo URL' },
  { key:'experience_years',  label:'Experience (Years)', type:'number' },
  { key:'projects_completed',label:'Projects Completed', type:'number' },
  { key:'specialization',    label:'Specialization' },
  { key:'city',              label:'City' },
  { key:'bio',               label:'Bio',  type:'textarea', fullWidth:true },
];
const ENG_BLANK = { name:'', photo_url:'', experience_years:'', projects_completed:'', specialization:'', city:'', bio:'' };

export function AdminCivilEngineers() {
  return <AdminCRUD title="Civil Engineers" fetchFn={expertsAPI.listCivil} createFn={expertsAPI.createCivil} updateFn={expertsAPI.updateCivil} deleteFn={expertsAPI.deleteCivil} fields={ENG_FIELDS} blankForm={ENG_BLANK} />;
}

// Interior Designers
const INT_FIELDS = [
  { key:'name',              label:'Name *' },
  { key:'photo_url',         label:'Photo URL' },
  { key:'experience_years',  label:'Experience (Years)', type:'number' },
  { key:'design_style',      label:'Design Style' },
  { key:'city',              label:'City' },
  { key:'bio',               label:'Bio',  type:'textarea', fullWidth:true },
];
const INT_BLANK = { name:'', photo_url:'', experience_years:'', design_style:'', city:'', bio:'' };

export function AdminInteriorDesigners() {
  return <AdminCRUD title="Interior Designers" fetchFn={expertsAPI.listInterior} createFn={expertsAPI.createInterior} updateFn={expertsAPI.updateInterior} deleteFn={expertsAPI.deleteInterior} fields={INT_FIELDS} blankForm={INT_BLANK} />;
}

// Exterior Designers
const EXT_FIELDS = [
  { key:'name',              label:'Name *' },
  { key:'photo_url',         label:'Photo URL' },
  { key:'experience_years',  label:'Experience (Years)', type:'number' },
  { key:'specialty',         label:'Specialty' },
  { key:'city',              label:'City' },
  { key:'bio',               label:'Bio',  type:'textarea', fullWidth:true },
];
const EXT_BLANK = { name:'', photo_url:'', experience_years:'', specialty:'', city:'', bio:'' };

export function AdminExteriorDesigners() {
  return <AdminCRUD title="Exterior Designers" fetchFn={expertsAPI.listExterior} createFn={expertsAPI.createExterior} updateFn={expertsAPI.updateExterior} deleteFn={expertsAPI.deleteExterior} fields={EXT_FIELDS} blankForm={EXT_BLANK} />;
}
