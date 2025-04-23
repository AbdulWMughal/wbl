import React from 'react';

export default function FieldInput({ field, value, onChange }) {
  switch (field.type) {
    case 'number':
      return (
        <input
          type="number"
          placeholder={field.label}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
        />
      );
    case 'select':
      return (
        <select value={value} onChange={e => onChange(e.target.value)} required>
          <option value="">Select {field.label}</option>
          {field.options.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case 'text':
    default:
      return (
        <input
          type="text"
          placeholder={field.label}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
        />
      );
  }
}
