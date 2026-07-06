import { getFileDetail } from '../files/files.service.js';

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

/**
 * Render a self-contained, printable HTML page for one side of the file (S12/S14/S16/H16).
 * side = 'noting' | 'correspondence'. Includes header/footer (file no / period / UN),
 * a confidential watermark, and the approval-summary table.
 */
export async function renderPrint(fileId: string, side: 'noting' | 'correspondence'): Promise<string> {
  const f = await getFileDetail(fileId);
  const printedOn = new Date().toLocaleString();
  const sideTitle = side === 'noting' ? 'NOTING SIDE' : 'CORRESPONDENCE SIDE';

  const period = [f.startPeriod ? new Date(f.startPeriod).toLocaleDateString() : '—', f.endPeriod ? new Date(f.endPeriod).toLocaleDateString() : 'open'].join(' → ');

  const notesHtml = (f.notes || []).map((n: any) => `
    <div class="note">
      <div class="note-head"><strong>Note ${esc(n.noteNumber)}</strong> <span class="muted">${esc(new Date(n.date).toLocaleString())}</span></div>
      <div class="note-body">${esc(n.content).replace(/\n/g, '<br/>')}</div>
      <div class="note-foot muted">— ${esc(n.author?.name)}, ${esc(n.author?.designation)} (${esc(n.author?.role)}) · Status: ${esc(n.status)}</div>
    </div>`).join('');

  const pageRange = (c: any) => (c.startPage ? (c.endPage && c.endPage !== c.startPage ? `${c.startPage}–${c.endPage}` : `${c.startPage}`) : '—');
  const corrHtml = (f.correspondence || []).map((c: any) => `
    <tr><td>${esc(c.number)}</td><td>${esc(c.type)}</td><td>${esc(c.title)}</td>
        <td>${c.inwardDate ? esc(new Date(c.inwardDate).toLocaleDateString()) : '—'}</td>
        <td>${esc(c.inwardNumber || '—')}</td>
        <td>${esc(pageRange(c))}</td></tr>`).join('');

  const stepsHtml = (f.steps || []).map((s: any) => `
    <tr>
      <td>${esc(s.stepOrder)}</td>
      <td>${esc(s.roleAtStep)}</td>
      <td>${esc(s.assigneeName)}</td>
      <td>${esc(s.dept || '—')}</td>
      <td>${s.actedAt ? esc(new Date(s.actedAt).toLocaleString()) : '—'}</td>
      <td>${esc(s.status)}</td>
      <td>${s.signatureName ? esc(s.signatureName) : '—'}</td>
    </tr>`).join('');

  const body = side === 'noting'
    ? `<h2>${sideTitle}</h2>${notesHtml || '<p class="muted">No notes.</p>'}`
    : `<h2>${sideTitle}</h2><table class="grid"><thead><tr><th>No.</th><th>Type</th><th>Title</th><th>Inward Date</th><th>Inward No.</th><th>Pages</th></tr></thead><tbody>${corrHtml || '<tr><td colspan="6" class="muted">No correspondence.</td></tr>'}</tbody></table>`;

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
  .note { border-left: 3px solid #cbd5e0; padding: 6px 12px; margin: 12px 0; page-break-inside: avoid; }
  .note-head { margin-bottom: 4px; }
  .grid { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .grid th, .grid td { border: 1px solid #cbd5e0; padding: 6px 8px; text-align: left; vertical-align: top; }
  .grid th { background: #f7fafc; }
  .summary { margin-top: 24px; page-break-inside: avoid; }
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
    <div class="summary">
      <h2>Approval Summary</h2>
      <table class="grid"><thead><tr><th>Step</th><th>Role</th><th>Name</th><th>Dept / Location</th><th>Date &amp; Time</th><th>Action</th><th>Signature</th></tr></thead>
      <tbody>${stepsHtml || '<tr><td colspan="7" class="muted">No approval steps.</td></tr>'}</tbody></table>
    </div>
  </div>
  <div class="runfoot"><span>${esc(f.fileNumber)} · ${esc(sideTitle)}</span><span>${f.confidential ? 'CONFIDENTIAL · ' : ''}Period ${esc(period)}</span></div>
</body></html>`;
}
