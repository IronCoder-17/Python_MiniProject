// components/CompareBar.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, X } from 'lucide-react';
import { getCompareList, removeFromCompare, clearCompare, onCompareChange, MAX_COMPARE } from '../services/compare';
import { propertiesAPI } from '../services/api';

export default function CompareBar() {
  const [ids, setIds] = useState(getCompareList());
  const [titles, setTitles] = useState({});
  const navigate = useNavigate();

  useEffect(() => onCompareChange(setIds), []);

  useEffect(() => {
    document.body.classList.toggle('has-compare-bar', ids.length > 0);
    return () => document.body.classList.remove('has-compare-bar');
  }, [ids]);

  useEffect(() => {
    ids.forEach(id => {
      if (titles[id]) return;
      propertiesAPI.get(id).then(r => {
        setTitles(t => ({ ...t, [id]: r.data.title }));
      }).catch(() => {});
    });
  }, [ids, titles]);

  if (ids.length === 0) return null;

  return (
    <div className="compare-bar">
      <div className="compare-bar-inner">
        <div className="compare-bar-label">
          <Scale size={16} /> Compare ({ids.length}/{MAX_COMPARE})
        </div>
        <div className="compare-bar-chips">
          {ids.map(id => (
            <span key={id} className="compare-chip">
              {titles[id] ? titles[id].slice(0, 22) + (titles[id].length > 22 ? '…' : '') : `#${id}`}
              <button type="button" onClick={() => removeFromCompare(id)} aria-label="Remove">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="compare-bar-actions">
          <button className="btn btn-ghost btn-sm" onClick={clearCompare}>Clear</button>
          <button
            className="btn btn-gold btn-sm"
            disabled={ids.length < 2}
            onClick={() => navigate('/compare')}
          >
            Compare Now
          </button>
        </div>
      </div>
    </div>
  );
}
