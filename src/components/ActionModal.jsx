import React, { useState } from 'react'
import { FiX } from 'react-icons/fi'
import './Modal.css'

/**
 * Generic small modal for lifecycle actions.
 * fields: [{ name, label, type: 'text'|'textarea'|'select'|'file', options?, required?, placeholder?, hint?, accept? }]
 * onSubmit(values) may be async; values[name] is a string, or a File for type 'file'.
 */
export default function ActionModal({ title, fields, submitLabel = 'Submit', onSubmit, onClose }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, f.type === 'file' ? null : ''])))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const set = (n, v) => setValues((s) => ({ ...s, [n]: v }))

  const submit = async (e) => {
    e.preventDefault()
    for (const f of fields) {
      if (f.required && !values[f.name]) { setError(`${f.label} is required`); return }
    }
    setBusy(true); setError(null)
    try { await onSubmit(values); onClose() } catch (err) { setError(err.message); setBusy(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          {fields.map((f) => (
            <div className="form-group" key={f.name}>
              <label>{f.label}{f.required ? ' *' : ''}</label>
              {f.type === 'textarea' ? (
                <textarea rows={3} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />
              ) : f.type === 'select' ? (
                <select value={values[f.name]} onChange={(e) => set(f.name, e.target.value)}>
                  <option value="">{f.placeholder || 'Select…'}</option>
                  {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === 'file' ? (
                <input type="file" accept={f.accept || ''} onChange={(e) => set(f.name, (e.target.files && e.target.files[0]) || null)} />
              ) : (
                <input type="text" value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />
              )}
              {f.hint && <small>{f.hint}</small>}
            </div>
          ))}
          {error && <div style={{ color: '#e53e3e', marginBottom: 12 }}>{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Working…' : submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
