import { useEffect, useState } from 'react';

const CURRENCIES = [
  { code: 'USD', label: 'USD' },
  { code: 'EUR', label: 'EUR' },
  { code: 'MLC', label: 'MLC' },
  { code: 'CUP', label: 'CUP' },
];

export function CurrencySelect({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [current, setCurrent] = useState(value || 'USD');
  useEffect(() => setCurrent(value || 'USD'), [value]);
  return (
    <select
      aria-label="Moneda"
      className="rounded-full bg-white/10 px-2 py-1 text-sm font-semibold text-white hover:bg-white/20"
      value={current}
      onChange={(e) => {
        setCurrent(e.target.value);
        onChange(e.target.value);
      }}
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code} className="text-black">
          {c.label}
        </option>
      ))}
    </select>
  );
}
