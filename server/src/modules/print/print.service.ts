import { getFileDetail } from '../files/files.service.js';

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

/**
 * Render a self-contained, printable HTML page for one side of the binder.
 *  - Noting side: each note prints with its page span and its OWN signature block (every person
 *    who signed that note), instead of one file-wide approval summary.
 *  - Correspondence side: the attachment register with page-level C-numbers.
 */
export interface PrintOptions {
  fromNote?: number;
  toNote?: number;
  last?: boolean; // print only the last note
}

export async function renderPrint(fileId: string, side: 'noting' | 'correspondence', opts: PrintOptions = {}): Promise<string> {
  const f = await getFileDetail(fileId);
  const printedOn = new Date().toLocaleString();
  const sideTitle = side === 'noting' ? 'NOTING SIDE' : 'CORRESPONDENCE SIDE';

  const period = [f.startPeriod ? new Date(f.startPeriod).toLocaleDateString() : '—', f.endPeriod ? new Date(f.endPeriod).toLocaleDateString() : 'open'].join(' → ');

  // Note-number range selection: full, last note, or a custom From–To range.
  let printNotes = (f.notes || []) as any[];
  let rangeLabel = 'All notes';
  if (opts.last && printNotes.length) {
    printNotes = [printNotes[printNotes.length - 1]];
    rangeLabel = `Last note (Note ${printNotes[0].noteNumber})`;
  } else if (opts.fromNote != null || opts.toNote != null) {
    const from = opts.fromNote ?? 1;
    const to = opts.toNote ?? Number.MAX_SAFE_INTEGER;
    printNotes = printNotes.filter((n) => n.noteNumber >= from && n.noteNumber <= to);
    rangeLabel = `Notes ${from}–${opts.toNote ?? '…'}`;
  }

  const notePages = (n: any) => (n.startPage ? (n.endPage && n.endPage !== n.startPage ? `pp. ${n.startPage}–${n.endPage}` : `p. ${n.startPage}`) : '');

  const signBlock = (n: any) => {
    const steps = (n.steps || []) as any[];
    if (!steps.length) return '<div class="muted sign-none">No signatories — recorded by the maker.</div>';
    const rows = steps.map((s) => `
      <tr>
        <td>${esc(s.stepOrder)}</td>
        <td>${esc(s.signerName)}</td>
        <td>${esc(s.roleLabel)}</td>
        <td>${esc(s.dept || '—')}</td>
        <td>${s.actedAt ? esc(new Date(s.actedAt).toLocaleString()) : '—'}</td>
        <td>${esc(s.status)}</td>
        <td>${s.signatureName ? esc(s.signatureName) : '—'}</td>
        <td>${esc(s.remarks || '—')}</td>
      </tr>`).join('');
    return `<table class="grid signs"><thead><tr><th>#</th><th>Signatory</th><th>Role</th><th>Dept</th><th>Date &amp; Time</th><th>Action</th><th>Signature</th><th>Remarks</th></tr></thead><tbody>${rows}</tbody></table>`;
  };

  const notesHtml = printNotes.map((n: any) => `
    <div class="note">
      <div class="note-head">
        <strong>Note ${esc(n.noteNumber)}</strong>
        <span class="muted">${esc(notePages(n))}</span>
        <span class="pill">${esc(n.status)}</span>
        <span class="muted">${esc(new Date(n.date).toLocaleString())}</span>
      </div>
      <div class="note-body">${esc(n.content).replace(/\n/g, '<br/>')}</div>
      <div class="note-foot muted">Maker: ${esc(n.author?.name)}, ${esc(n.author?.designation)} (${esc(n.author?.role)})</div>
      <div class="note-signs"><div class="signs-title">Signatories for this note</div>${signBlock(n)}</div>
    </div>`).join('');

  const pageRange = (c: any) => (c.cLabel && c.cLabel !== '—' ? c.cLabel : '—');
  const corrHtml = (f.correspondence || []).map((c: any) => `
    <tr><td>${esc(pageRange(c))}</td><td>${esc(c.type)}</td><td>${esc(c.title)}</td>
        <td>${c.inwardDate ? esc(new Date(c.inwardDate).toLocaleDateString()) : '—'}</td>
        <td>${esc(c.inwardNumber || '—')}</td>
        <td>${esc(c.pageCount ?? '—')}</td></tr>`).join('');

  const body = side === 'noting'
    ? `<h2>${sideTitle} <span class="muted" style="font-size:12px;font-weight:400">(${esc(rangeLabel)})</span></h2>${notesHtml || '<p class="muted">No notes in this range.</p>'}`
    : `<h2>${sideTitle}</h2><table class="grid"><thead><tr><th>C-No.</th><th>Type</th><th>Title</th><th>Inward Date</th><th>Inward No.</th><th>Pages</th></tr></thead><tbody>${corrHtml || '<tr><td colspan="6" class="muted">No correspondence.</td></tr>'}</tbody></table>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(f.fileNumber)} — ${sideTitle}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a202c; margin: 0; padding: 92px 28px 64px; font-size: 13px; }
  @page { margin: 16mm; }
  .runhead { position: fixed; top: 0; left: 0; right: 0; padding: 10px 28px; border-bottom: 2px solid #2d3748; background: #fff; font-size: 12px; display: flex; justify-content: space-between; gap: 12px; }
  .runfoot { position: fixed; bottom: 0; left: 0; right: 0; padding: 8px 28px; border-top: 1px solid #cbd5e0; background: #fff; font-size: 11px; color: #718096; display: flex; justify-content: space-between; }
  .runhead .n { font-weight: 700; }
  h1 { font-size: 18px; margin: 4px 0 2px; }
  h2 { font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; }
  .muted { color: #718096; }
  .pill { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .5px; padding: 1px 6px; border-radius: 10px; background: #edf2f7; color: #4a5568; }
  .note { border-left: 3px solid #cbd5e0; padding: 6px 12px; margin: 14px 0; page-break-inside: avoid; }
  .note-head { margin-bottom: 4px; display: flex; gap: 10px; align-items: center; }
  .note-signs { margin-top: 8px; }
  .signs-title { font-size: 11px; font-weight: 700; color: #4a5568; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 4px; }
  .sign-none { font-size: 12px; }
  .grid { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .grid th, .grid td { border: 1px solid #cbd5e0; padding: 5px 7px; text-align: left; vertical-align: top; }
  .grid th { background: #f7fafc; }
  .signs th, .signs td { font-size: 11px; }
  .cover { margin-bottom: 8px; }
  .cover span { display: inline-block; margin-right: 16px; }
  ${f.confidential ? `.watermark { position: fixed; top: 42%; left: 50%; transform: translate(-50%,-50%) rotate(-28deg); font-size: 90px; color: rgba(229,62,62,0.12); font-weight: 800; letter-spacing: 8px; z-index: 0; }` : ''}
  .print-btn { position: fixed; top: 10px; right: 28px; z-index: 10; padding: 6px 12px; background: #4c51bf; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
  @media print { .print-btn { display: none; } }
  .content { position: relative; z-index: 1; }
</style></head><body>
  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  <div class="runhead"><span class="n">${esc(f.fileNumber)}</span><span>${esc(f.section)}</span><span>${esc(f.subject)}</span><span>Printed: ${esc(printedOn)}</span></div>
  ${f.confidential ? '<div class="watermark">CONFIDENTIAL</div>' : ''}
  <div class="content">
    <h1>${esc(f.subject)}</h1>
    <div class="cover muted">
      <span><strong>File No:</strong> ${esc(f.fileNumber)}</span>
      <span><strong>UN No:</strong> ${esc(f.unNumber || '—')}</span>
      <span><strong>Section:</strong> ${esc(f.section)}</span>
      <span><strong>Period:</strong> ${esc(period)}</span>
      <span><strong>Status:</strong> ${esc(f.status)}</span>
    </div>
    ${body}
  </div>
  <div class="runfoot"><span>${esc(f.fileNumber)} · ${esc(sideTitle)}</span><span>${f.confidential ? 'CONFIDENTIAL · ' : ''}Period ${esc(period)}</span></div>
</body></html>`;
}
