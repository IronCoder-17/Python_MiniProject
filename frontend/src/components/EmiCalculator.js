// components/EmiCalculator.js
// Standard reducing-balance EMI calculator: EMI = P·r·(1+r)^n / ((1+r)^n − 1)
// Self-contained — usable as a compact sidebar widget on the property detail
// page (pre-filled from the property price) or embedded anywhere else.
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator } from 'lucide-react';

const fmt = (v) => `₹${Math.round(v).toLocaleString('en-IN')}`;
const fmtShort = (v) => {
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
};

export default function EmiCalculator({ propertyPrice, compact = false }) {
  const defaultLoan = propertyPrice ? Math.round(propertyPrice * 0.8) : 5000000;
  const [loanAmount, setLoanAmount] = useState(defaultLoan);
  const [rate, setRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);

  const { emi, totalPayment, totalInterest } = useMemo(() => {
    const P = loanAmount;
    const r = rate / 12 / 100;
    const n = tenureYears * 12;
    if (P <= 0 || r <= 0 || n <= 0) return { emi: 0, totalPayment: 0, totalInterest: 0 };
    const e = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return {
      emi: e,
      totalPayment: e * n,
      totalInterest: (e * n) - P,
    };
  }, [loanAmount, rate, tenureYears]);

  const pieData = [
    { name: 'Principal', value: loanAmount },
    { name: 'Interest', value: totalInterest },
  ];
  const COLORS = ['#C9A24B', '#8A7A5A'];

  return (
    <div className={`emi-calc ${compact ? 'emi-calc-compact' : ''}`}>
      {!compact && (
        <h3 className="h4" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calculator size={18} style={{ color: 'var(--gold)' }} /> EMI Calculator
        </h3>
      )}

      <div className="emi-field">
        <div className="flex-between">
          <label className="emi-label">Loan Amount</label>
          <span className="emi-value">{fmtShort(loanAmount)}</span>
        </div>
        <input
          type="range" min={100000} max={200000000} step={50000}
          value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value))}
        />
      </div>

      <div className="emi-field">
        <div className="flex-between">
          <label className="emi-label">Interest Rate</label>
          <span className="emi-value">{rate}%</span>
        </div>
        <input
          type="range" min={5} max={16} step={0.05}
          value={rate} onChange={e => setRate(Number(e.target.value))}
        />
      </div>

      <div className="emi-field">
        <div className="flex-between">
          <label className="emi-label">Loan Tenure</label>
          <span className="emi-value">{tenureYears} Yrs</span>
        </div>
        <input
          type="range" min={1} max={30} step={1}
          value={tenureYears} onChange={e => setTenureYears(Number(e.target.value))}
        />
      </div>

      <div className="emi-result">
        <div className="emi-result-main">
          <div className="emi-result-label">Monthly EMI</div>
          <div className="emi-result-value">{fmt(emi)}</div>
        </div>
        <div className="emi-result-row">
          <div>
            <div className="emi-result-sub-label">Total Interest</div>
            <div className="emi-result-sub-value">{fmtShort(totalInterest)}</div>
          </div>
          <div>
            <div className="emi-result-sub-label">Total Payment</div>
            <div className="emi-result-sub-value">{fmtShort(totalPayment)}</div>
          </div>
        </div>
      </div>

      {!compact && (
        <div style={{ marginTop: 20 }}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                {pieData.map((entry, i) => <Cell key={entry.name} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={v => fmtShort(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: '.78rem', color: 'var(--mist)', marginTop: 8 }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: COLORS[0], borderRadius: 2, marginRight: 6 }} />Principal</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: COLORS[1], borderRadius: 2, marginRight: 6 }} />Interest</span>
          </div>
        </div>
      )}
    </div>
  );
}
