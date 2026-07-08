import React, { useState } from 'react'
import { FiX, FiPrinter } from 'react-icons/fi'
import { openPrint } from '../api/print'
import './Modal.css'

/** Custom print (A6): choose side, and for Noting a note-number range (full / last / custom).
 *  Physical page ranges are handled by the browser's own Print dialog (noted below). */
const PrintModal = ({ file, onClose }) => {
  const [side, setSide] = useState('noting')
  const [mode, setMode] = useState('all') // all | last | custom
  const [fromNote, setFromNote] = useState('')
  const [toNote, setToNote] = useState('')

  const maxNote = (file.notes || []).reduce((m, n) => Math.max(m, n.noteNumber), 0)

  const doPrint = () => {
    const opts = {}
    if (side === 'noting') {
      if (mode === 'last') opts.last = true
      else if (mode === 'custom') {
        if (fromNote) opts.fromNote = Number(fromNote)
        if (toNote) opts.toNote = Number(toNote)
      }
    }
    openPrint(file.id, side, opts)
    onClose()
  }

  const radio = (val, label, cur, set) => (
    <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input type="radio" checked={cur === val} onChange={() => set(val)} /> <span>{label}</span>
    </label>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h2><FiPrinter style={{ verticalAlign: '-2px' }} /> Print</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Which side?</label>
            <div style={{ display: 'flex', gap: 16 }}>
              {radio('noting', 'Noting', side, setSide)}
              {radio('correspondence', 'Correspondence', side, setSide)}
            </div>
          </div>

          {side === 'noting' && (
            <div className="form-group" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
              <label>Note range</label>
              {radio('all', 'All notes', mode, setMode)}
              {radio('last', 'Last note only', mode, setMode)}
              {radio('custom', 'Custom note range', mode, setMode)}
              {mode === 'custom' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <span>Notes</span>
                  <input type="number" min={1} max={maxNote} value={fromNote} onChange={(e) => setFromNote(e.target.value)} placeholder="from" style={{ width: 80 }} />
                  <span>to</span>
                  <input type="number" min={1} max={maxNote} value={toNote} onChange={(e) => setToNote(e.target.value)} placeholder="to" style={{ width: 80 }} />
                  <span style={{ color: '#a0aec0', fontSize: 12 }}>(1–{maxNote})</span>
                </div>
              )}
            </div>
          )}

          <p style={{ fontSize: 12, color: '#718096' }}>
            Tip: for specific <strong>physical pages</strong>, choose the range here, then use your browser’s
            Print dialog (Ctrl/Cmd+P) “Pages” box to pick exact printed pages.
          </p>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn-primary" onClick={doPrint}><FiPrinter /> Open Print View</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrintModal
