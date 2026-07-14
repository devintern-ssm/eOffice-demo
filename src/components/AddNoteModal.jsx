import React, { useEffect, useRef, useState } from 'react'
import { FiX, FiSend, FiArrowUp, FiArrowDown, FiTrash2, FiStar } from 'react-icons/fi'
import { useAuth } from '../auth/AuthContext'
import { addNote, submitNote, updateNote } from '../api/notes'
import { listUsers } from '../api/users'
import './Modal.css'

const ROLE_OPTIONS = ['Checker', 'Approver', 'Final Approver', 'MD', 'Signatory']
const DEFAULT_ROLE = { CHECKER: 'Checker', APPROVER: 'Approver', MD: 'MD' }

/** Extract formal references (C-page numbers and Note numbers) from the note's text.
 *  Word-boundary guards so substrings like "ABC3" or "Footnote 3" are not captured. */
const extractRefs = (text) => ({
  correspondence: [...new Set([...text.matchAll(/(?<![A-Za-z0-9])C\/?(\d+)(?![A-Za-z0-9])/gi)].map((m) => `C${m[1]}`))],
  notes: [...new Set([...text.matchAll(/(?<![A-Za-z0-9])Note\s+(\d+)(?![A-Za-z0-9])/gi)].map((m) => `Note ${m[1]}`))],
})

/**
 * Open a note (you become its maker) and, on Submit, put it up for signature through an ordered
 * signer chain whose LAST member is the final signatory. Also used to put an existing DRAFT /
 * RETURNED note up for signature (pass `note`).
 */
const AddNoteModal = ({ file, note, onClose, onSaved }) => {
  const { user } = useAuth()
  const editing = !!note
  const [noteContent, setNoteContent] = useState(note?.content || '')
  const [users, setUsers] = useState([])
  // When re-submitting a RETURNED/DRAFT note, seed the chain from its existing steps so the
  // maker keeps (and can adjust) the original signers instead of silently submitting an empty chain.
  const [chain, setChain] = useState(() => (note?.steps || []).map((s) => ({ userId: s.signerId, roleLabel: s.roleLabel, name: s.signerName })))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const taRef = useRef(null)

  useEffect(() => { listUsers().then(setUsers).catch(() => {}) }, [])
  const candidates = users.filter((u) => u.id !== user?.id && u.role !== 'ADMIN')

  const inChain = (id) => chain.some((c) => c.userId === id)
  const toggleSigner = (u) => setChain((prev) => (
    inChain(u.id) ? prev.filter((c) => c.userId !== u.id)
      : [...prev, { userId: u.id, roleLabel: DEFAULT_ROLE[u.role] || 'Signatory', name: u.name, section: u.section }]
  ))
  const setRole = (id, roleLabel) => setChain((prev) => prev.map((c) => (c.userId === id ? { ...c, roleLabel } : c)))
  const move = (i, dir) => setChain((prev) => {
    const next = [...prev]; const j = i + dir
    if (j < 0 || j >= next.length) return prev
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
  })

  // Insert a reference token (e.g. "C3") into the note text at the cursor.
  const insertToken = (token) => {
    const el = taRef.current
    const s = el ? el.selectionStart : noteContent.length
    const e = el ? el.selectionEnd : noteContent.length
    const before = noteContent.slice(0, s)
    const after = noteContent.slice(e)
    const ins = `${before && !/\s$/.test(before) ? ' ' : ''}${token}`
    const next = `${before}${ins}${after}`
    setNoteContent(next)
    setTimeout(() => { if (el) { const pos = (before + ins).length; el.focus(); el.setSelectionRange(pos, pos) } }, 0)
  }

  const signers = chain.map((c) => ({ userId: c.userId, roleLabel: c.roleLabel }))

  // Only keep references that point at real correspondence pages / existing notes.
  const validRefs = () => {
    const validC = new Set()
    ;(file.correspondence || []).forEach((c) => { if (c.firstC != null) for (let n = c.firstC; n <= c.lastC; n += 1) validC.add(`C${n}`) })
    const validNotes = new Set((file.notes || []).map((n) => `Note ${n.noteNumber}`))
    const ex = extractRefs(noteContent)
    return { correspondence: ex.correspondence.filter((r) => validC.has(r)), notes: ex.notes.filter((r) => validNotes.has(r)) }
  }

  const save = async (isDraft) => {
    if (!noteContent.trim()) { setError('Note content is required'); return }
    setSubmitting(true); setError(null)
    const references = validRefs()
    try {
      if (editing) {
        await updateNote(file.id, note.id, { content: noteContent, references })
        if (!isDraft) await submitNote(file.id, note.id, { signers })
      } else {
        await addNote(file.id, { content: noteContent, isDraft, references, signers: isDraft ? [] : signers })
      }
      onSaved && onSaved()
      onClose()
    } catch (err) {
      setError(err.message); setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editing ? `Put Note ${note.noteNumber} up for signature` : 'Open a Note'}</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); save(false) }} className="modal-body">
          <div className="form-group">
            <label>Note Content *</label>
            <textarea ref={taRef} value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your note. Type or insert a page reference (e.g. Refer C3) — it becomes a clickable link…" rows={8} />
            <small style={{ color: '#718096' }}>Tip: click a correspondence page below to drop its reference (e.g. <strong>C3</strong>) where your cursor is.</small>
          </div>

          {/* Reference a correspondence page — inserts C{n} at the cursor */}
          <div className="form-group">
            <label>Reference a correspondence page</label>
            <div className="reference-list" style={{ maxHeight: 150 }}>
              {(file.correspondence || []).length === 0 && <div className="empty-ref">No correspondence in this file</div>}
              {(file.correspondence || []).map((corr) => (
                <div key={corr.id} style={{ padding: '4px 0', borderBottom: '1px solid #edf2f7' }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{corr.cLabel || corr.number} — <span style={{ fontWeight: 400, color: '#4a5568' }}>{corr.title}</span></div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {(corr.cPages && corr.cPages.length ? corr.cPages : []).map((cn) => (
                      <button type="button" key={cn} className="corr-btn" style={{ width: 'auto', padding: '2px 9px' }}
                        title={`Insert reference to page C${cn}`} onClick={() => insertToken(`C${cn}`)}>C{cn}</button>
                    ))}
                    {(!corr.cPages || corr.cPages.length === 0) && <span style={{ fontSize: 11, color: '#a0aec0' }}>no page-numbered pages</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reference a previous note */}
          {(file.notes || []).filter((n) => n.status !== 'DRAFT').length > 0 && (
            <div className="form-group">
              <label>Reference a previous note</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(file.notes || []).filter((n) => n.status !== 'DRAFT').map((n) => (
                  <button type="button" key={n.id} className="corr-btn" style={{ width: 'auto', padding: '2px 9px' }} onClick={() => insertToken(`Note ${n.noteNumber}`)}>Note {n.noteNumber}</button>
                ))}
              </div>
            </div>
          )}

          {/* Ordered signer chain — the LAST member is the final signatory */}
          <div className="form-group" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
            <label style={{ fontWeight: 600 }}>Signature chain</label>
            <small style={{ display: 'block', marginBottom: 8, color: '#718096' }}>
              Applied when you <strong>Submit</strong>. The file moves to each signer in order; the <strong>last signer is the final approver</strong> — their signature finalizes the note.
              Leave empty to simply record the note yourself.
            </small>
            <div className="reference-list" style={{ maxHeight: 140 }}>
              {candidates.map((u) => (
                <label key={u.id} className="reference-item">
                  <input type="checkbox" checked={inChain(u.id)} onChange={() => toggleSigner(u)} />
                  <span>{u.name} <em style={{ color: '#718096' }}>— {u.section} ({u.role})</em></span>
                </label>
              ))}
              {candidates.length === 0 && <div className="empty-ref">Loading users…</div>}
            </div>

            {chain.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Chain order</label>
                {chain.map((c, i) => {
                  const isFinal = i === chain.length - 1
                  return (
                    <div key={c.userId} style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                      <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700, color: '#4c51bf' }}>{i + 1}</span>
                      <span style={{ flex: 1 }}>
                        {c.name}
                        {isFinal && <span title="Final signatory — finalizes the note" style={{ marginLeft: 6, fontSize: 11, color: '#38a169', fontWeight: 700 }}><FiStar style={{ verticalAlign: '-2px' }} /> Final signatory</span>}
                      </span>
                      <select value={c.roleLabel} onChange={(e) => setRole(c.userId, e.target.value)} style={{ padding: 4, borderRadius: 6, border: '1px solid #cbd5e0' }}>
                        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <button type="button" className="corr-btn" style={{ width: 'auto', padding: '4px 6px' }} onClick={() => move(i, -1)} disabled={i === 0}><FiArrowUp /></button>
                      <button type="button" className="corr-btn" style={{ width: 'auto', padding: '4px 6px' }} onClick={() => move(i, 1)} disabled={i === chain.length - 1}><FiArrowDown /></button>
                      <button type="button" className="corr-btn" style={{ width: 'auto', padding: '4px 6px' }} onClick={() => toggleSigner({ id: c.userId })}><FiTrash2 /></button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Maker</label>
            <div className="author-display">{editing ? note.author?.name : `${user?.name} - ${user?.designation}`}</div>
          </div>

          {error && <div className="form-error" style={{ color: '#e53e3e', marginBottom: 12 }}>{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn-draft" onClick={() => save(true)} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Draft'}
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <FiSend /> {submitting ? 'Submitting…' : chain.length ? 'Submit for Signature' : 'Record Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddNoteModal
