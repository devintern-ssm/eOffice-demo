// Continuous page numbering for both sides of the binder.
//  - Correspondence: every PAGE gets its own C-number (C1…Cn). An attachment occupies a
//    contiguous run of C-numbers; the next attachment continues.
//  - Noting: notes are text, so their page span is ESTIMATED at render time (finalized notes
//    are immutable, so their spans are stable; new notes append). Cumulative + continuous.

const CHARS_PER_LINE = 90;
const LINES_PER_PAGE = 42;

/** Estimate how many printed pages a note's content fills (min 1). */
export function estimateNotePages(content: string): number {
  const lines = (content ?? '').split('\n');
  let wrapped = 0;
  for (const line of lines) wrapped += Math.max(1, Math.ceil(line.length / CHARS_PER_LINE));
  return Math.max(1, Math.ceil(wrapped / LINES_PER_PAGE));
}

export interface CorrPaging { firstC: number | null; lastC: number | null; pages: number[] }

/**
 * Assign page-level C-numbers across correspondence in order. Attachments with no counted
 * pages (e.g. an email reference) are skipped and get {firstC:null,lastC:null,pages:[]}.
 */
export function computeCorrespondencePaging<T extends { id: string; pageCount: number | null }>(
  ordered: T[],
): Map<string, CorrPaging> {
  const out = new Map<string, CorrPaging>();
  let runC = 0;
  for (const c of ordered) {
    const n = c.pageCount ?? 0;
    if (n > 0) {
      const firstC = runC + 1;
      const pages: number[] = [];
      for (let i = 0; i < n; i += 1) pages.push(firstC + i);
      runC += n;
      out.set(c.id, { firstC, lastC: runC, pages });
    } else {
      out.set(c.id, { firstC: null, lastC: null, pages: [] });
    }
  }
  return out;
}

export interface NotePaging { startPage: number; endPage: number; pageCount: number }

/**
 * Assign continuous noting-side page spans. Only "official" notes (not DRAFT) occupy pages,
 * in noteNumber order. Returns a map noteId -> {startPage,endPage,pageCount}.
 */
export function paginateNotes<T extends { id: string; content: string; status: string }>(
  orderedByNoteNumber: T[],
): Map<string, NotePaging> {
  const out = new Map<string, NotePaging>();
  let run = 0;
  for (const n of orderedByNoteNumber) {
    if (n.status === 'DRAFT') continue;
    const pageCount = estimateNotePages(n.content);
    const startPage = run + 1;
    run += pageCount;
    out.set(n.id, { startPage, endPage: run, pageCount });
  }
  return out;
}
